---
'@openid4vc/openid4vci': minor
---

The client can now encrypt credential and deferred credential requests. Pass `credentialRequestEncryption` (`{ jwk, enc }`, with a key from the issuer's `credential_request_encryption.jwks`) and an `encryptJwe` callback, and the request is sent as a JWE with content type `application/jwt`. The issuer metadata schema accepts `credential_request_encryption`.

The client throws before sending when the issuer requires request encryption and none was configured, and, for OpenID4VCI 1.0 issuers, when response encryption is requested without request encryption, as the specification requires.
