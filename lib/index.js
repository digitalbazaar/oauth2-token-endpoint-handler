/*!
 * Copyright (c) 2020 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const {
  UnauthorizedClient, InvalidGrant, InvalidRequest, InvalidClient
} = require('@interop/oauth2-errors');

// Default Access token expiration in seconds (two weeks)
const DEFAULT_MAX_AGE = 1209600;

/**
 * Constructs a middleware handler for OAuth 2.0 /token exchange requests.
 *
 * @param {object} options - Options hashmap.
 * @param {object} [options.defaults={}] - Token issuance defaults.
 * @param {object} options.logger - Logger.
 * @param {Function} options.getClient - Callback to load client by id.
 * @param {Function} options.issue - Callback to issue the JWT access token for
 *   client.
 *
 * @example <caption>Example usage.</caption>
 * tokenExchangeHandler({
 *   defaults: {},
 *   logger: console,
 *   getClient: async ({clientId}) => {
 *     // load client from the db, then:
 *     return {client};
 *   }),
 *   issue: async ({client, scope, body, defaultMaxAge}) => {
 *     // issue JWT access token here
 *     return {accessToken, expiresIn};
 *   })
  },
 * });
 *
 * @returns {Promise<Function>} Resolves with exchange middleware.
 */
function tokenExchangeHandler({defaults = {}, logger, getClient, issue}) {
  return async (req, res) => {
    try {
      const {body} = req;
      const {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: grantType,
        scope
      } = body;

      _validateParams({clientId, clientSecret, grantType, scope});

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

      _authenticateClient({client, clientSecret});

      const defaultMaxAge = defaults.defaultMaxAge || DEFAULT_MAX_AGE;

      const {accessToken, expiresIn} = await issue({
        client, scope, body, defaultMaxAge
      });

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

function _authenticateClient({client, clientSecret}) {
  if(!client) {
    throw new InvalidClient({
      description: 'Unknown client identifier.'
    });
  }

  const {client_secret: storedClientSecret} = client;

  if(clientSecret !== storedClientSecret) {
    throw new InvalidClient({
      description: 'Mismatched client secret.'
    });
  }
}

function _validateParams({clientId, clientSecret, grantType, scope}) {
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
  if(!scope) {
    throw new InvalidRequest({
      description: 'Missing scope parameter.'
    });
  }
  if(grantType !== 'client_credentials') {
    throw new InvalidGrant({
      error: 'unsupported_grant_type',
      description: `Grant type "${grantType}" is not supported.`
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
  if(logger) {
    logger.error('Token exchange endpoint error.', {error});
  }
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

module.exports = {
  tokenExchangeHandler,
  _respond
};
