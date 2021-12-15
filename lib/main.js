/*!
 * Copyright (c) 2020 Digital Bazaar, Inc. All rights reserved.
 */
import assert from 'assert-plus';
import noopLogger from './noopLogger';
import {
  UnauthorizedClient, InvalidGrant, InvalidRequest, InvalidClient
} from '@interop/oauth2-errors';

// Default Access token expiration in seconds (two weeks)
const DEFAULT_MAX_AGE = 1209600;

/**
 * Constructs a middleware handler for OAuth 2.0 /token exchange requests.
 *
 * @param {object} options - Options hashmap.
 * @param {Function} options.authenticateClient - Async callback that
 *   authenticates the client token.
 * @param {object} [options.defaults={}] - Token issuance defaults.
 * @param {object} [options.logger] - Logger.
 * @param {object} options.cache - Cache for the access token. There is no
 *   forced cache clearing, so if a client secret is updated, the old
 *   access token will continue to be handed out until the cache releases it.
 * @param {Function} options.getClient - Async callback to load client by ID.
 * @param {Function} options.issue - Async callback that issues the JWT access
 *   token for the client.
 *
 * @example <caption>Example usage.</caption>
 * tokenExchangeHandler({
 *  defaults: {},
 *  logger: console,
 *  getClient: async ({clientId}) => {
 *    // load client from the db, then:
 *    return {client};
 *  },
 *  issue: async ({client, scope, body, defaultMaxAge}) => {
 *    // issue JWT access token here
 *    return {accessToken, expiresIn};
 *  },
 * });
 *
 * @returns {Function<Promise>} Resolves with exchange middleware.
 */
function tokenExchangeHandler({
  authenticateClient,
  defaults = {},
  getClient,
  issue,
  cache,
  logger = noopLogger,
}) {
  assert.func(authenticateClient, 'authenticateClient');
  assert.func(getClient, 'getClient');
  assert.func(issue, 'issue');

  return async (req, res) => {
    try {
      const {body} = req;
      const {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: grantType,
        scope: scopeRequested,
        redirect_uri: redirectUri
      } = body;

      _validateParams({clientId, clientSecret, grantType, redirectUri});

      let client;
      try {
        client = await getClient({clientId});
      } catch(cause) {
        const error = new InvalidRequest({
          description: 'Could not load client.'
        });
        error.cause = cause;
        throw error;
      }

      const {authenticated} = await authenticateClient({client, clientSecret});
      if(!authenticated) {
        throw new InvalidClient({
          description: 'The client secret could not be authenticated.'
        });
      }

      const defaultMaxAge = defaults.defaultMaxAge || DEFAULT_MAX_AGE;

      const key = JSON.stringify([client, scopeRequested, body, defaultMaxAge]);
      const fn = () => issue({
        client, scopeRequested, body, defaultMaxAge
      });

      const {accessToken, expiresIn, scope} = await cache.memoize({key, fn});

      const response = {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: expiresIn,
        scope
      };

      _respond({response, res});
    } catch(error) {
      _error({error, logger, res});
    }
  };
}

function _validateParams({clientId, clientSecret, grantType, redirectUri}) {
  if(!(clientId && clientSecret)) {
    throw new UnauthorizedClient({
      description: 'Missing client credentials at the Token endpoint.'
    });
  }
  if(!grantType) {
    throw new InvalidRequest({
      description: 'Missing grant_type parameter.'
    });
  }
  if(grantType !== 'client_credentials') {
    throw new InvalidGrant({
      error: 'unsupported_grant_type',
      description: `Grant type "${grantType}" is not supported.`
    });
  }
  if(grantType === 'client_credentials' && redirectUri) {
    throw new InvalidGrant({
      error: 'unsupported_client_credentials_grant',
      description: 'Grant type "client_credentials" cannot ' +
        'have "redirectUri" param.'
    });
  }
}

function _respond({response, res}) {
  res.set({
    'Cache-Control': 'no-store',
    Pragma: 'no-cache'
  });

  res.status(201).json(response);
}

function _error({error, logger, res}) {
  logger.error('Token exchange endpoint error.', {error});
  const {
    error: errorId, error_description: description, error_uri: uri
  } = error;

  const statusCode = error.statusCode || 400;
  const oauth2ErrorResponse = {
    error: errorId || 'invalid_request',
    error_description: description || error.message,
    error_uri: uri
  };
  res.set({
    'Cache-Control': 'no-store',
    Pragma: 'no-cache'
  });
  return res.status(statusCode).json(oauth2ErrorResponse);
}

export {
  tokenExchangeHandler,
  _respond
};
