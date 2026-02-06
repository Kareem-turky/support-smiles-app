# Quality Gate

This document describes the project's quality gate system for local development and CI.

## Scripts Overview

| Script | Purpose | Exit Behavior |
|--------|---------|---------------|
| `npm run lint` | Development linting | Allows warnings (exit 0) |
| `npm run lint:strict` | CI linting | Fails on ANY warning (exit 1) |
| `npm run test` | Run tests once | Standard test run |
| `npm run test:serial` | Run tests sequentially | No parallelism, deterministic |
| `npm run test:ci` | CI test run | Sequential + coverage |
| `npm run check` | **Full quality gate** | lint:strict + test:ci |

## Local Development

```bash
# Quick lint check (allows warnings)
npm run lint

# Run tests
npm run test:serial

# Full quality gate (same as CI)
npm run check
```

## CI/CD

The CI workflow runs `npm run check` which:
1. Runs `lint:strict` (fails on any warning)
2. Runs `test:ci` (tests + coverage)

### GitHub Actions

The workflow is defined in `.github/workflows/ci.yml` and runs on:
- Push to `main` or `master`
- Pull requests to `main` or `master`

## Coverage

Coverage is configured via Vitest with the V8 provider.

### Thresholds

| Metric | Threshold | Current |
|--------|-----------|---------|
| Lines | 60% | ~76% |
| Statements | 60% | ~76% |
| Functions | 55% | ~70% |
| Branches | 45% | ~71% |

### Viewing Coverage Report

After running `npm run test:ci`, open the HTML report:

```bash
open coverage/index.html
```

Or view the text summary in the terminal output.

### Coverage Scope

Coverage is measured on the services layer (`src/services/**`) which contains the core business logic. UI components are excluded from thresholds.

## Network Blocking

All tests run with strict network blocking. Any real HTTP call will fail immediately with:
- `TEST_NETWORK_BLOCKED: fetch attempted to GET http://...`
- `TEST_NETWORK_BLOCKED: XMLHttpRequest attempted to POST http://...`

Unknown API endpoints will fail with:
- `TEST_API_UNHANDLED_ROUTE: GET /unknown/path`

This ensures tests are deterministic and don't depend on a running backend.
