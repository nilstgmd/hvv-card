# Contributing to HVV Card

Thank you for your interest in contributing to HVV Card! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and constructive in all interactions. We welcome contributions from everyone.

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm
- Git

### Development Setup

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/hvv-card.git
   cd hvv-card
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run tests to verify setup:
   ```bash
   npm test
   ```

## Development Workflow

### Branch Strategy

All changes must go through a separate branch and pull request:

- `fix/` - Bug fixes (e.g., `fix/sort-departures-by-actual-time`)
- `feat/` - New features (e.g., `feat/display-cancelled-departures`)
- `docs/` - Documentation changes
- `refactor/` - Code refactoring

### Making Changes

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. Make your changes to `hvv-card.js`

3. Add or update tests in `tests/hvv-card.test.js`

4. Run tests locally:
   ```bash
   npm test
   ```

5. Update documentation:
   - Update `README.md` if adding new features or options
   - Add JSDoc comments for new functions

6. Commit your changes using [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat: add new feature description"
   git commit -m "fix: resolve issue with sorting"
   git commit -m "docs: update README with new option"
   ```

7. Push your branch and create a pull request

### Commit Message Format

We use Conventional Commits for automatic changelog generation:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Example:
```
feat: add visual indicator for cancelled departures

Cancelled departures now show with strikethrough text and a
"Cancelled" badge instead of departure time.

Fixes #9
```

## Testing

### Running Tests

```bash
npm test
```

### Writing Tests

Tests are written using Jest with jsdom. See existing tests in `tests/hvv-card.test.js` for examples.

Key patterns:
- Mock the LitElement base class in `beforeAll`
- Create card instances with `document.createElement('hvv-card')`
- Set config with `card.setConfig({ ... })`
- Set hass state with `card.hass = { states: { ... } }`
- Render and check output with `String(card.render())`

## Pull Request Guidelines

### Before Submitting

- [ ] All tests pass (`npm test`)
- [ ] Code follows existing style
- [ ] Documentation is updated (if applicable)
- [ ] Commit messages follow Conventional Commits

### PR Description

- Clearly describe what the PR does
- Reference any related issues (e.g., "Fixes #123")
- Include screenshots for UI changes
- List any breaking changes

## Release Process

Releases are automated using [Release Please](https://github.com/googleapis/release-please). When PRs are merged to `main`:

1. Release Please creates/updates a release PR with changelog
2. When the release PR is merged, a new GitHub release is created
3. Version numbers follow [Semantic Versioning](https://semver.org/)

## Getting Help

- Check existing [issues](https://github.com/nilstgmd/hvv-card/issues)
- Open a new issue for bugs or feature requests
- Ask questions in issue discussions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
