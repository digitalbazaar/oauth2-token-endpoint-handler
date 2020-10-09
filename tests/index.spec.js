'use strict';
const chai = require('chai');
chai.use(require('chai-http'));
chai.should();

const express = require('express');
const bodyParserUrl = express.urlencoded({extended: true});

const {
  tokenExchangeHandler
} = require('../lib');

const tokenUrl = '/token';
const MOCK_ACCESS_TOKEN = 'eyJhbGciOiJFUzI1NiIsImtpZCI6Ijc3In0' +
  '.eyJpc3MiOiJodHRwOi8vYXV0aG9yaXphdGlvbi1zZXJ2ZXIuZXhhbXBsZS5jb20iLCJzdW' +
  'IiOiJfX2JfYyIsImV4cCI6MTU4ODQyMDgwMCwic2NvcGUiOiJjYWxlbmRhciIsImF1ZCI6I' +
  'mh0dHBzOi8vY2FsLmV4YW1wbGUuY29tLyJ9.nNWJ2dXSxaDRdMUKlzs-cYI' +
  'j8MDoM6Gy7pf_sKrLGsAFf1C2bDhB60DQfW1DZL5npdko1_Mmk5sUfzkiQNVpYw';

// eslint-disable-next-line no-unused-vars
const mockGetClient = async ({clientId}) => {
  return {
    client: {
      client_id: 's6BhdRkqt3',
      client_secret: '7Fjfp0ZBr1KtDRbnfVdmIw',
      scope: ''
    }
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
      getClient: mockGetClient,
      issue: mockIssue
    })
  );

  let requester;

  before(async () => {
    requester = chai.request(app).keepOpen();
  });

  after(async () => {
    requester.close();
  });

  it.skip('should work', async () => {
  });
});
