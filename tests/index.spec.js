'use strict';
const chai = require('chai');
chai.use(require('chai-http'));
chai.should();
// const {expect} = chai;

const express = require('express');
const bodyParserJson = express.json();

const {
  handleTokenRequest
} = require('../lib');

const tokenUrl = '/token';

describe('handleTokenRequest', () => {
  const app = express();
  app.post(
    tokenUrl,
    bodyParserJson,
    handleTokenRequest({})
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
