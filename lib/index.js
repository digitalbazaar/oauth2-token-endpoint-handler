/*!
 * Copyright (c) 2020 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';
// const {generateId} = require('bnid');
// const {snakeCase} = require('snake-case');
// const {
//   InvalidRequest, AccessDenied
// } = require('@interop/oauth2-errors');

function handleTokenRequest({logger}) {
  return async (req, res) => {
    try {
    } catch(error) {
      if(logger) {
        logger.error(error);
      }
      error.respond(res);
    }
  };
}
odule.exports = {
  handleTokenRequest
};
