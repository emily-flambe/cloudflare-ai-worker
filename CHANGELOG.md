# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2025-07-06

### Added
- Initial release of Cloudflare Workers AI API service (July 6, 2025)
- Core AI endpoints with proper response formatting:
  - `/api/v1/ai/chat` - Interactive chat with Llama 3.1 8B and Mistral 7B models
  - `/api/v1/ai/complete` - Text completion with streaming support
  - `/api/v1/ai/embeddings` - Text embeddings using BGE Base EN v1.5
  - `/api/v1/ai/survey/normalize` - Survey question normalization (PR #4, Issue #3)
  - `/api/v1/chat` - Generic chat endpoint with customizable system prompts
- Bearer token authentication with API key generation
- Rate limiting (100 requests/hour) using Cloudflare KV storage
- Comprehensive error handling and structured logging
- Full TypeScript support with proper AI binding types
- Cloudflare Workers deployment configuration
- Custom domain support (ai.emilycogsdill.com, cutty.app)
- Interactive test scripts for different AI personalities
- Test suite with Vitest
- GitHub Actions CI workflow
- ESLint and Prettier configuration

### Fixed
- Chat endpoint 500 Internal Server Error (Issue #1) - Fixed AI response format handling
- CORS routing issues - Changed from router.all to router.options
- TypeScript type issues with Cloudflare AI bindings
- AI response formatting standardized across all endpoints

### Security
- Removed hardcoded API_SECRET from wrangler.toml
- Migrated to Cloudflare Secrets Store as single source of truth
- JWT-based authentication with secure token generation
- Environment variable management for local development (.dev.vars)
- Input validation and sanitization

### Changed
- Refactored authentication to use Cloudflare Secrets Store exclusively
- Standardized API response format across all endpoints
- Moved from Cutty-specific to generic AI assistant implementation
- Replaced test.html with script-based testing approach

### Removed
- GitHub Actions deployment workflow (due to Cloudflare deployment issues)
- Hardcoded secrets from configuration files
- Unused test.html file

[Unreleased]: https://github.com/emily-flambe/cloudflare-ai-worker/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/emily-flambe/cloudflare-ai-worker/releases/tag/v1.0.0