# GitHub Source-Parity Record

The public repository is the source release for **AI Agent Hub**. Its baseline is the final AI Agent Hub release snapshot, with the following validated CI repairs added afterward:

- `.github/workflows/ci.yml` runs dependency installation, TypeScript validation, Vitest, and the production build on each push and pull request.
- `server/aiAgent.test.ts` mocks deployment-only database and external-service boundaries so CI does not require production credentials.

## Intentional exclusions from shared-project parity

The managed workspace is shared with unrelated work. The following items are intentionally not copied into this public AI Agent Hub repository:

| Exclusion                                                                  | Reason                                                                     |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Facebook Profile Optimizer source, routes, migrations, and UI              | Separate shared-project work; not part of AI Agent Hub.                    |
| Local `todo.md` changes                                                    | Session-level tracking, not application source.                            |
| `client/public/__manus__`                                                  | Generated runtime metadata.                                                |
| `.git/`, dependency directories, build output, logs, and environment files | Local metadata, generated content, or potentially sensitive configuration. |

`README.md` is intentionally retained in the public repository as release documentation. The latest GitHub Actions CI run confirms that the published application source type-checks, tests, and builds successfully.
