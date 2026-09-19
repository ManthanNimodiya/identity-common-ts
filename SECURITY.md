# Security Policy

## Supported Versions

We release security patches and updates for actively maintained versions. The table below outlines supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.x.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a potential security vulnerability in this project, please report it responsibly and privately.

**Please do NOT disclose security vulnerabilities through public GitHub issues, discussions, or pull requests.**

### Preferred Reporting Channels

1. **GitHub Private Vulnerability Reporting**:
   Submit a confidential advisory directly via [GitHub Security Advisories](https://github.com/openwallet-foundation-labs/identity-common-ts/security/advisories/new).

2. **Email**:
   Send an encrypted or confidential email to the OpenWallet Foundation security team:
   - **Recipient**: <security@openwallet.foundation>
   - **Subject**: `[SECURITY] identity-common-ts: <brief description>`

### Information to Include

To help us triage and resolve the report quickly, please include as much detail as possible:

- Type and severity of the vulnerability (e.g., authentication bypass, injection, cryptographic flaw)
- Affected packages and version(s)
- Location of the affected code (tag, branch, commit, or direct file link)
- Clear step-by-step instructions to reproduce the issue
- Minimal proof-of-concept (PoC) code or sample inputs
- Potential impact and exploitation scenarios

## Response Timeline and SLAs

- **Initial Acknowledgment**: Within **3 business days** of receipt.
- **Triage and Assessment**: Within **10 business days**, including preliminary severity assessment and reproduction verification.
- **Remediation & Patch**: Fix development and testing will be prioritized based on severity.
- **Coordinated Disclosure**: Fixes will be released alongside a published security advisory and CVE identifier (where applicable).

## Coordinated Vulnerability Disclosure Process

When a security vulnerability is reported and confirmed:

1. **Investigation**: Maintainers verify the report and determine all affected packages and versions.
2. **Patch Development**: Fixes are developed in private forks / advisories and thoroughly tested against regressions.
3. **Release**: Security releases are published to package registries.
4. **Advisory Publication**: A public security advisory is published on GitHub and relevant mailing lists detailing the impact, affected versions, and mitigation/upgrade steps.

## Security Best Practices

When integrating this library into your application:

1. **Keep dependencies updated**: Regularly apply dependency updates and audit transitive dependencies.
2. **Validate inputs**: Always validate incoming presentation payloads, credentials, and parameters against the corresponding schemas.
3. **Use secure cryptographic implementations**: Provide production-grade, vetted cryptographic functions and secure random number generators for keys and salts.
4. **Principle of least privilege**: Request only necessary disclosure frames and limit token lifetimes appropriately.
5. **Key Management**: Protect private keys in secure hardware or dedicated key management systems (KMS).
