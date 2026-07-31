# Contributing

This repository currently has no configured ESLint, Prettier, or automated
test script. Follow the existing code style and run the available verification
commands before opening a pull request.

## Branches

Create focused branches using one of these prefixes:

```text
feature/<short-description>
fix/<short-description>
docs/<short-description>
chore/<short-description>
```

Example: `feature/provider-status`.

## Commit messages

Use short, imperative Conventional Commit-style subjects:

```text
feat: add document deletion endpoint
fix: preserve partial tokens after stream abort
docs: clarify local Chroma setup
chore: update dependency lockfile
```

Keep unrelated formatting changes out of functional commits.

## Code expectations

- Use ES modules and the existing import style.
- Preserve the current React function-component and hook conventions.
- Keep server route handlers thin; place reusable retrieval/generation logic in
  `server/services/`.
- Require authentication and ownership checks for user-scoped resources.
- Keep API keys and provider calls on the server. Never add secrets to client
  source, committed environment files, or documentation examples.
- Maintain the existing SSE event contract when changing streaming behavior;
  see [API.md](API.md#sse-event-format).
- Preserve the RAG fallback behavior: an unavailable Chroma service must not
  make document upload or chat unusable.
- Prefer concise comments that explain non-obvious decisions.

If linting/formatting tooling is added later, document the command in this file
and run it before review. Do not claim a formatter is enforced until it is
actually configured.

## Verification before a PR

Run these commands from the repository root or indicated directory:

```bash
# Client production build
cd client
npm run build

# Server syntax checks (from repository root after returning with cd ..)
cd ..
node --check server/server.js
node --check server/controllers/chatController.js
Get-ChildItem server/services/aiProviders -Filter *.js | ForEach-Object { node --check $_.FullName }

# Check for malformed whitespace in the diff
git diff --check
```

The final command in the server check uses PowerShell, which matches the
project's documented Windows development environment. On another shell, run
`node --check` for each changed server JavaScript file.

For changes that require a running stack, also manually verify the affected
flow: signup/login, conversation ownership, upload/retrieval, a complete
stream, and a stopped stream where relevant.

## Pull requests

Include:

- What changed and why.
- Any environment variables or migration implications.
- Verification commands and manual scenarios run.
- UI screenshots for visible client changes when useful.
- Follow-up work that is intentionally out of scope.

Keep pull requests narrowly scoped. Do not include real credentials, generated
uploads, `client/dist/`, or local Chroma data.
