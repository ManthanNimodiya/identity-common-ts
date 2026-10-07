---
"@openid4vc/oauth2": minor
---

Unify the clock skew option name to `allowedSkewInSeconds` and add a server-level default.

- **Breaking:** the DPoP `allowedClockSkewSeconds` option is renamed to `allowedSkewInSeconds`. This applies to `verifyDpopJwt` and to the `dpop` options of `verifyPushedAuthorizationRequest`, `verifyAuthorizationChallengeRequest`, the `verify*AccessTokenRequest` methods and `verifyResourceRequest`.
- Add `allowedSkewInSeconds` to `Oauth2AuthorizationServer` as the default allowed clock skew for DPoP and client attestation verification in `verifyPushedAuthorizationRequest`, `verifyAuthorizationChallengeRequest`, the `verify*AccessTokenRequest` methods, `verifyDpopJwt` and `verifyClientAttestation`. A per-call `allowedSkewInSeconds` in the DPoP or client attestation options overrides the server default, including `0`.
- The `verify*AccessTokenRequest` methods now pass `now` to DPoP proof verification, so the DPoP `iat` checks use the provided time instead of the current time.
