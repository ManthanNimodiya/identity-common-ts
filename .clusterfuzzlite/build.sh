#!/bin/bash -eu

# Install pnpm and build project packages
npm install -g pnpm@10.28.0
pnpm install --frozen-lockfile
pnpm build

# Compile Jazzer.js fuzz targets into $OUT
compile_javascript_fuzzer identity-common-ts tests/fuzz/sd-jwt.fuzz.js fuzzer_sd_jwt
compile_javascript_fuzzer identity-common-ts tests/fuzz/cbor.fuzz.js fuzzer_cbor
compile_javascript_fuzzer identity-common-ts tests/fuzz/dcql.fuzz.js fuzzer_dcql
