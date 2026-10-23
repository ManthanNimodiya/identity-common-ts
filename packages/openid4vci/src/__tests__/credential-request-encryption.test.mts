import crypto from 'node:crypto'
import type { CallbackContext, Jwk } from '@openid4vc/oauth2'
import { ContentType } from '@openid4vc/utils'
import * as jose from 'jose'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import { getSignJwtCallback, callbacks as partialCallbacks } from '../../../oauth2/src/__tests__/util.mjs'
import {
  type CredentialConfigurationSupportedWithFormats,
  type IssuerMetadataResult,
  Openid4vciClient,
  Openid4vciIssuer,
  Openid4vciVersion,
} from '../index.js'

const issuerKeys = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
const issuerEncryptionJwk = {
  ...(issuerKeys.publicKey.export({ format: 'jwk' }) as Jwk),
  kid: 'issuer-enc-1',
  alg: 'RSA-OAEP',
  use: 'enc',
}

const walletKeys = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
const walletEncryptionJwk = walletKeys.publicKey.export({ format: 'jwk' }) as Jwk

const server = setupServer()

const encryptJwe: CallbackContext['encryptJwe'] = async (encryptor, payload) => {
  const publicKey = await jose.importJWK(encryptor.publicJwk as jose.JWK, encryptor.alg)
  const jwe = await new jose.CompactEncrypt(new TextEncoder().encode(payload))
    .setProtectedHeader({ alg: encryptor.alg, enc: encryptor.enc, kid: encryptor.publicJwk.kid })
    .encrypt(publicKey)
  return { jwe, encryptionJwk: encryptor.publicJwk }
}

const decryptJwe: CallbackContext['decryptJwe'] = async (jwe) => {
  try {
    const { plaintext } = await jose.compactDecrypt(jwe, walletKeys.privateKey)
    return {
      decrypted: true as const,
      payload: new TextDecoder().decode(plaintext),
      decryptionJwk: walletEncryptionJwk,
    }
  } catch {
    return { decrypted: false as const }
  }
}

const decryptRequest = async (request: Request) => {
  expect(request.headers.get('Content-Type')).toBe(ContentType.Jwt)
  const { plaintext, protectedHeader } = await jose.compactDecrypt(await request.text(), issuerKeys.privateKey)
  expect(protectedHeader).toMatchObject({ alg: 'RSA-OAEP', enc: 'A256GCM', kid: 'issuer-enc-1' })
  return JSON.parse(new TextDecoder().decode(plaintext)) as Record<string, unknown>
}

const { encryptJwe: _encryptJwe, ...callbacksWithoutEncryptJwe } = partialCallbacks
const lazyFetch: typeof fetch = (...args) => fetch(...args)
const signJwt = getSignJwtCallback([])
const callbacks = { ...partialCallbacks, fetch: lazyFetch, signJwt, encryptJwe, decryptJwe }
const client = new Openid4vciClient({ callbacks })
const issuer = new Openid4vciIssuer({ callbacks })

const credentialConfigurationsSupported = {
  pidSdJwt: {
    format: 'dc+sd-jwt',
    vct: 'https://sd-jwt.com',
    credential_signing_alg_values_supported: ['ES256'],
    cryptographic_binding_methods_supported: ['jwk'],
  },
} satisfies Record<string, CredentialConfigurationSupportedWithFormats>

const createIssuerMetadata = (encryptionRequired = false, version = Openid4vciVersion.V1) => {
  const credentialIssuer = issuer.createCredentialIssuerMetadata({
    credential_issuer: 'https://oid4vc-ts-issuer.com',
    credential_endpoint: 'https://oid4vc-ts-issuer.com/credential',
    deferred_credential_endpoint: 'https://oid4vc-ts-issuer.com/deferred-credential',
    credential_configurations_supported: credentialConfigurationsSupported,
    credential_request_encryption: {
      jwks: { keys: [issuerEncryptionJwk] },
      enc_values_supported: ['A256GCM'],
      encryption_required: encryptionRequired,
    },
    credential_response_encryption: {
      alg_values_supported: ['RSA-OAEP'],
      enc_values_supported: ['A256GCM'],
      encryption_required: false,
    },
  })

  return {
    credentialIssuer,
    authorizationServers: [],
    originalDraftVersion: version,
    knownCredentialConfigurations: credentialConfigurationsSupported,
  } satisfies IssuerMetadataResult
}

const credentialRequestEncryption = { jwk: issuerEncryptionJwk, enc: 'A256GCM' }
const credentialResponseEncryption = { jwk: { ...walletEncryptionJwk, alg: 'RSA-OAEP' }, enc: 'A256GCM' }

describe('Credential Request Encryption', () => {
  beforeAll(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  test('client encrypts the credential request to the issuer key and decrypts the response', async () => {
    const issuerMetadata = createIssuerMetadata()
    let receivedRequest: Record<string, unknown> | undefined

    server.resetHandlers(
      http.post(issuerMetadata.credentialIssuer.credential_endpoint, async ({ request }) => {
        receivedRequest = await decryptRequest(request)
        const { credentialResponseJwt } = await issuer.createCredentialResponse({
          credential: 'some-credential',
          credentialRequest: issuer.parseCredentialRequest({ issuerMetadata, credentialRequest: receivedRequest }),
          credentialResponseEncryption,
        })
        return new HttpResponse(credentialResponseJwt, { headers: { 'Content-Type': ContentType.Jwt } })
      })
    )

    const result = await client.retrieveCredentials({
      issuerMetadata,
      accessToken: 'token',
      credentialConfigurationId: 'pidSdJwt',
      credentialRequestEncryption,
      credentialResponseEncryption,
    })

    expect(receivedRequest).toEqual({
      credential_configuration_id: 'pidSdJwt',
      credential_response_encryption: credentialResponseEncryption,
    })
    expect(result.credentialResponse.credential).toBe('some-credential')
  })

  test('client encrypts the deferred credential request', async () => {
    const issuerMetadata = createIssuerMetadata()
    let receivedRequest: Record<string, unknown> | undefined

    server.resetHandlers(
      http.post(issuerMetadata.credentialIssuer.deferred_credential_endpoint as string, async ({ request }) => {
        receivedRequest = await decryptRequest(request)
        return HttpResponse.json({ transaction_id: 'tx-1', interval: 5 }, { status: 202 })
      })
    )

    await client.retrieveDeferredCredentials({
      issuerMetadata,
      accessToken: 'token',
      transactionId: 'tx-1',
      credentialRequestEncryption,
    })

    expect(receivedRequest).toEqual({ transaction_id: 'tx-1' })
  })

  test('sends a plain JSON request when no encryption is requested or required', async () => {
    const issuerMetadata = createIssuerMetadata()
    server.resetHandlers(
      http.post(issuerMetadata.credentialIssuer.credential_endpoint, async ({ request }) => {
        expect(request.headers.get('Content-Type')).toBe(ContentType.Json)
        expect(await request.json()).toEqual({ credential_configuration_id: 'pidSdJwt' })
        return HttpResponse.json({ credentials: [{ credential: 'some-credential' }] })
      })
    )

    const result = await client.retrieveCredentials({
      issuerMetadata,
      accessToken: 'token',
      credentialConfigurationId: 'pidSdJwt',
    })
    expect(result.credentialResponse.credentials).toEqual([{ credential: 'some-credential' }])
  })

  test('rejects requests that cannot be encrypted as the issuer or the spec require', async () => {
    const retrieve = (options: Partial<Parameters<Openid4vciClient['retrieveCredentials']>[0]>) =>
      client.retrieveCredentials({
        issuerMetadata: createIssuerMetadata(),
        accessToken: 'token',
        credentialConfigurationId: 'pidSdJwt',
        ...options,
      })

    await expect(retrieve({ issuerMetadata: createIssuerMetadata(true) })).rejects.toThrow(
      "requires credential request encryption, but 'credentialRequestEncryption' was not provided"
    )
    await expect(retrieve({ credentialResponseEncryption })).rejects.toThrow(
      'Credential response encryption requires the credential request to be encrypted'
    )
    await expect(
      retrieve({ credentialRequestEncryption: { jwk: { ...issuerEncryptionJwk, kid: 'other' }, enc: 'A256GCM' } })
    ).rejects.toThrow("must be one of the keys in the 'credential_request_encryption.jwks'")
    await expect(
      retrieve({ credentialRequestEncryption: { jwk: issuerEncryptionJwk, enc: 'A128GCM' } })
    ).rejects.toThrow("Credential request encryption 'enc' must be one of 'A256GCM'")

    const clientWithoutEncryption = new Openid4vciClient({
      callbacks: { ...callbacksWithoutEncryptJwe, fetch: lazyFetch, signJwt, decryptJwe },
    })
    await expect(
      clientWithoutEncryption.retrieveCredentials({
        issuerMetadata: createIssuerMetadata(),
        accessToken: 'token',
        credentialConfigurationId: 'pidSdJwt',
        credentialRequestEncryption,
      })
    ).rejects.toThrow("'callbacks.encryptJwe' is not defined")
  })

  test('keeps allowing response encryption without request encryption before OpenID4VCI 1.0', async () => {
    const issuerMetadata = createIssuerMetadata(false, Openid4vciVersion.Draft15)
    server.resetHandlers(
      http.post(issuerMetadata.credentialIssuer.credential_endpoint, async ({ request }) => {
        expect(request.headers.get('Content-Type')).toBe(ContentType.Json)
        return HttpResponse.json({ credentials: [{ credential: 'some-credential' }] })
      })
    )

    await expect(
      client.retrieveCredentials({
        issuerMetadata,
        accessToken: 'token',
        credentialConfigurationId: 'pidSdJwt',
        credentialResponseEncryption,
      })
    ).rejects.toThrow("Encryption was requested via 'credential_response_encryption'")
  })
})
