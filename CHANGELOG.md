# @digitalbazaar/oauth2-token-endpoint-handler ChangeLog

## 3.0.0 - 2023-TBD

### Changed
- **BREAKING**: Convert to module (ESM).
- **BREAKING**: Drop support for node <= 14.
- Update dev deps to latest.
- Use `c8@7.12.0` for coverage.

## 2.0.0 - 2021-12-15

### Added
- **BREAKING**: Added new parameter `cache` to `tokenExchangeHandler`. This is
  for security, as it limits the number of access tokens issued to each client.
  There is no forced cache clearing, so if a client secret is updated, the old
  access token will continue to be handed out until the cache releases it.

## 1.0.2 - 2020-10-11

### Changed
- Fix: Allow issuer to control `scope` of token (based on `scopeRequested`).

## 1.0.1 - 2020-10-11

### Changed
- Fix: Make `scope` parameter optional for `client_credentials` grant,
  per the OAuth 2.0 spec.

## 1.0.0 - 2020-10-09

- Initial release. See git history for changes.
