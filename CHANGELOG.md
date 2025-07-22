# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2025-01-22

### Added
- Initial release of Cloudflare Workers AI API service
- Core AI chat functionality with streaming support
- Multiple AI endpoints:
  - `/api/v1/ai/chat` - Interactive chat with AI models
  - `/api/v1/ai/complete` - Text completion
  - `/api/v1/ai/survey/normalize` - Survey question normalization
  - `/api/v1/ai/embeddings` - Generate text embeddings
  - `/api/v1/ai/images/classify` - Image classification
  - `/api/v1/ai/speech/recognize` - Speech recognition
- Authentication system with JWT tokens and API keys
- Rate limiting and request validation
- Comprehensive error handling and logging
- Full TypeScript support
- Cloudflare Workers deployment configuration
- Custom domain support (cutty.app)
- Development environment with hot reload
- Test suite with Vitest

### Security
- Secure API key generation and validation
- JWT-based authentication
- Environment variable management for secrets
- Input validation and sanitization

[Unreleased]: https://github.com/emily-flambe/cloudflare-ai-worker/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/emily-flambe/cloudflare-ai-worker/releases/tag/v1.0.0