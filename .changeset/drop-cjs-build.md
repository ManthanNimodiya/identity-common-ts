---
'@owf/cose': patch
'@owf/crypto': patch
'@owf/eudi-access-certificate': patch
'@owf/eudi-attestation-schema': patch
'@owf/eudi-jades': patch
'@owf/eudi-lote': patch
'@owf/eudi-registration-certificate': patch
'@owf/eudi-sca': patch
'@owf/eudi-tl': patch
'@owf/identity-common': patch
'@sd-jwt/core': patch
'@sd-jwt/sd-jwt-vc': patch
'@owf/token-status-list': patch
'@owf/x509': patch
---

Drop the CommonJS build from all packages; only ESM is now published. All environments targeted by this library support ESM natively. This removes the dual-package hazard that caused `instanceof` checks to fail in Metro/Hermes and similar single-module-system runtimes.
