# Bedrock OAuth2 Token Request Handler _(oauth2-token-endpoint-handler)_

[![Node.js CI](https://github.com/digitalbazaar/oauth2-token-endpoint-handler/workflows/Node.js%20CI/badge.svg)](https://github.com/digitalbazaar/oauth2-token-endpoint-handler/actions?query=workflow%3A%22Node.js+CI%22)

> OAuth2 Token endpoint handler for custom authorization servers.

## Table of Contents

- [Background](#background)
- [Security](#security)
- [Install](#install)
- [Usage](#usage)
- [Contribute](#contribute)
- [Commercial Support](#commercial-support)
- [License](#license)

## Background

Limitations / design constraints:

* Only supports the `client_credentials` grant.
* Only supports `client_secret_post` endpoint authentication method.
* Does not support Refresh Tokens (clients can just perform the token exchange
  again, when their original Access Token expires).

Inspired by:

 * [`oauth2orize`](https://github.com/jaredhanson/oauth2orize) and
   [`@passport-next/oauth2orize`](https://github.com/passport-next/oauth2orize)
 * [`oauth2orize-jwt-bearer`](https://github.com/xtuple/oauth2orize-jwt-bearer)
 * [`node-oidc-provider`](https://github.com/panva/node-oidc-provider)

Relevant specifications:

* [OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749)
* [Resource Indicators for OAuth 2.0](https://tools.ietf.org/html/rfc8707)

## Security

TBD

## Install

- Node.js 12+ is required.

To install locally (for development):

```
git clone https://github.com/digitalbazaar/oauth2-token-endpoint-handler.git
cd oauth2-token-endpoint-handler
npm install
```

## Usage

```js
const {handleTokenExchange} = require('oauth2-token-endpoint-handler');

app.post('/token',
  // ... make sure to mount url-encoded body parser such as express.urlencoded()
  handleTokenExchange({
    baseUrl: 'https://as.example.com',
    defaults: {
      // (Optional) token expiration in seconds. Defaults to 2 weeks
      defaultMaxAge: 1209600
    },
    logger: console,
    getClient: async ({clientId}) => {
      // load client from the db, then:
      return {client};
    },
    issue: async ({client, resource, scope, body, defaultMaxAge}) => {
      // issue JWT access token here
      return {accessToken, expiresIn};
    }
  })
);
```

Example request:

```
POST /token HTTP/1.1
Host: as.example.com
Content-Type: application/x-www-form-urlencoded

client_id=s6BhdRkqt3
&client_secret=7Fjfp0ZBr1KtDRbnfVdmIw
&grant_type=client_credentials
&scope=some.resource.read
&resource=https%3A%2F%2Fcalendar.example.com%2F
&resource=https%3A%2F%2Fcontacts.example.com%2F
```

Example response:

```
HTTP/1.1 200 OK
Content-Type: application/json;charset=UTF-8
Cache-Control: no-store
Pragma: no-cache

{
  "access_token": "eyJhbGciOiJFUzI1NiIsImtpZCI6Ijc3In0.eyJpc3MiOiJodHRwOi8vYXV0aG9yaXphdGlvbi1zZXJ2ZXIuZXhhbXBsZS5jb20iLCJzdWIiOiJfX2JfYyIsImV4cCI6MTU4ODQyMDgwMCwic2NvcGUiOiJjYWxlbmRhciIsImF1ZCI6Imh0dHBzOi8vY2FsLmV4YW1wbGUuY29tLyJ9.nNWJ2dXSxaDRdMUKlzs-cYIj8MDoM6Gy7pf_sKrLGsAFf1C2bDhB60DQfW1DZL5npdko1_Mmk5sUfzkiQNVpYw",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "some.resource.read"
}
```

## Contribute

See [the contribute file](https://github.com/digitalbazaar/bedrock/blob/master/CONTRIBUTING.md)!

PRs accepted.

If editing the Readme, please conform to the
[standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## Commercial Support

Commercial support for this library is available upon request from
Digital Bazaar: support@digitalbazaar.com

## License

[New BSD License (3-clause)](LICENSE) © Digital Bazaar
