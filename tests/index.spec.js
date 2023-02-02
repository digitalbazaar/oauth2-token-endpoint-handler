/*!
 * Copyright (c) 2020-2023 Digital Bazaar, Inc. All rights reserved.
 */
import {_respond, tokenExchangeHandler} from '../lib/index.js';
import chai from 'chai';
import chaiHttp from 'chai-http';
import express from 'express';
import {InvalidClient} from '@interop/oauth2-errors';
import {LruCache} from '@digitalbazaar/lru-memoize';
import noopLogger from '../lib/noopLogger.js';

const cache = new LruCache({
  max: 10,
  // 5 minutes
  maxAge: 300000
});

chai.use(chaiHttp);
chai.should();

const {expect} = chai;
const bodyParserUrl = express.urlencoded({extended: true});

const tokenUrl = '/token';
const MOCK_ACCESS_TOKEN = 'eyJhbGciOiJFUzI1NiIsImtpZCI6Ijc3In0' +
  '.eyJpc3MiOiJodHRwOi8vYXV0aG9yaXphdGlvbi1zZXJ2ZXIuZXhhbXBsZS5jb20iLCJzdW' +
  'IiOiJfX2JfYyIsImV4cCI6MTU4ODQyMDgwMCwic2NvcGUiOiJjYWxlbmRhciIsImF1ZCI6I' +
  'mh0dHBzOi8vY2FsLmV4YW1wbGUuY29tLyJ9.nNWJ2dXSxaDRdMUKlzs-cYI' +
  'j8MDoM6Gy7pf_sKrLGsAFf1C2bDhB60DQfW1DZL5npdko1_Mmk5sUfzkiQNVpYw';

const mockAuthenticateClient = async ({client, clientSecret}) => {
  if(!client) {
    throw new InvalidClient({
      description: 'Unknown client identifier.'
    });
  }
  const {client_secret: storedClientSecret} = client;

  // NOTE: a timing safe comparison is required, this example is NOT secure
  return {authenticated: clientSecret === storedClientSecret};
};

const mockGetClient = async ({clientId = 's6BhdRkqt3'}) => {
  return {
    client_id: clientId,
    client_secret: '7Fjfp0ZBr1KtDRbnfVdmIw',
    scope: ''
  };
};

// eslint-disable-next-line no-unused-vars
const mockIssue = async ({client, resource, scope, body, defaultMaxAge}) => {
  return {
    accessToken: MOCK_ACCESS_TOKEN,
    expiresIn: 3600
  };
};

describe('tokenExchangeHandler', () => {
  const app = express();
  app.post(
    tokenUrl,
    bodyParserUrl,
    tokenExchangeHandler({
      authenticateClient: mockAuthenticateClient,
      getClient: mockGetClient,
      issue: mockIssue,
      cache
    })
  );

  let requester;

  before(async () => {
    requester = chai.request(app).keepOpen();
  });

  after(async () => {
    requester.close();
  });

  it(`should properly export noopLogger`, async () => {
    (typeof noopLogger === 'object').should.be.true;
  });
  it(`should properly export functions from main.js`, async () => {
    (typeof tokenExchangeHandler === 'function').should.be.true;
    (typeof _respond === 'function').should.be.true;
  });
  it('should error if missing client credentials', async () => {
    const res = await requester.post(tokenUrl).send({});
    expect(res).to.have.status(400);
    expect(res).to.be.json;
    expect(res.body.error).to.equal('unauthorized_client');
    expect(res.body.error_description)
      .to.equal('Missing client credentials at the Token endpoint.');
  });
  it('should error if missing grant_type param', async () => {
    const res = await requester.post(tokenUrl)
      .set('content-type', 'application/x-www-form-urlencoded')
      .send({
        client_id: 'some_id',
        client_secret: 'test_secret'
      });
    expect(res).to.have.status(400);
    expect(res).to.be.json;
    expect(res.body.error).to.equal('invalid_request');
    expect(res.body.error_description)
      .to.equal('Missing grant_type parameter.');
  });
  it('should error if grant_type is invalid', async () => {
    const res = await requester.post(tokenUrl)
      .set('content-type', 'application/x-www-form-urlencoded')
      .send({
        client_id: 'some_id',
        client_secret: 'test_secret',
        grant_type: 'invalid_type'
      });
    expect(res).to.have.status(400);
    expect(res).to.be.json;
    expect(res.body.error).to.equal('invalid_grant');
    expect(res.body.error_description)
      .to.equal('Grant type "invalid_type" is not supported.');
  });
  it('should error if grant_type is client_credentials and ' +
  'redirectUri is given', async () => {
    const res = await requester.post(tokenUrl)
      .set('content-type', 'application/x-www-form-urlencoded')
      .send({
        client_id: 'some_id',
        client_secret: 'test_secret',
        grant_type: 'client_credentials',
        redirect_uri: 'http://example.com'
      });
    expect(res).to.have.status(400);
    expect(res).to.be.json;
    expect(res.body.error).to.equal('invalid_grant');
    expect(res.body.error_description)
      .to.equal(
        'Grant type "client_credentials" cannot have "redirectUri" param.');
  });
  it('should error if client secret is invalid', async () => {
    const res = await requester.post(tokenUrl)
      .set('content-type', 'application/x-www-form-urlencoded')
      .send({
        client_id: 'some_id',
        client_secret: 'invalid_secret',
        grant_type: 'client_credentials',
      });
    expect(res).to.have.status(401);
    expect(res).to.be.json;
    expect(res.body.error).to.equal('invalid_client');
    expect(res.body.error_description).to.equal(
      'The client secret could not be authenticated.');
  });
  it('should return a valid access token with correct client credentials',
    async () => {
      const res = await requester.post(tokenUrl)
        .set('content-type', 'application/x-www-form-urlencoded')
        .send({
          client_id: 'some_id',
          client_secret: '7Fjfp0ZBr1KtDRbnfVdmIw',
          grant_type: 'client_credentials',
        });
      expect(res).to.have.status(201);
      expect(res).to.be.json;
      expect(res.body.access_token).to.be.a('string');
      expect(res.body.token_type).to.be.a('string');
      expect(res.body.token_type).to.equal('Bearer');
      expect(res.body.expires_in).to.be.a('number');
      expect(res.body.expires_in).to.equal(3600);
    });
  it('should error if it fails to load client', async () => {
    const badApp = express();
    badApp.post(
      tokenUrl,
      bodyParserUrl,
      tokenExchangeHandler({
        authenticateClient: mockAuthenticateClient,
        getClient: () => {
          throw new Error('Failed to get client.');
        },
        issue: mockIssue
      })
    );
    const res = await chai.request(badApp).post(tokenUrl)
      .set('content-type', 'application/x-www-form-urlencoded')
      .send({
        client_id: 'some_id',
        client_secret: '7Fjfp0ZBr1KtDRbnfVdmIw',
        grant_type: 'client_credentials',
      });
    expect(res).to.have.status(400);
    expect(res).to.be.json;
    expect(res.body.error).to.equal('invalid_request');
    expect(res.body.error_description).to.equal('Could not load client.');
  });
});
