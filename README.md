# AI Agent Hub

AI Agent Hub is a private, authenticated workspace for LLM-assisted conversations, GitHub research, Hugging Face inference, and document analysis. Each chat session is scoped to the signed-in Manus user, and uploaded documents are stored using the managed storage layer.

## Included capabilities

| Area           | Implementation                                                           |
| -------------- | ------------------------------------------------------------------------ |
| Authentication | Manus OAuth with per-user data access checks.                            |
| Agent chat     | Server-side LLM calls with Markdown rendering.                           |
| GitHub tools   | Repository search, file access, code search, and issue creation helpers. |
| Hugging Face   | Server-side Inference API client.                                        |
| Documents      | Private PDF, TXT, MD, CSV, and JSON upload flow with an 8 MB limit.      |
| Persistence    | Database-backed sessions, messages, attachments, and tool logs.          |

## Local development

Install dependencies with `pnpm install`, then start the development server with `pnpm dev`. Run `pnpm check`, `pnpm test`, and `pnpm build` before deployment.

## Configuration

The production platform supplies Manus OAuth, database, storage, and built-in LLM environment variables. For GitHub or Hugging Face actions in an independently deployed instance, configure these **server-only** secrets:

```text
GITHUB_TOKEN=
HUGGINGFACE_API_KEY=
```

Do not expose either secret to client-side code or commit an `.env` file. GitHub mutations, such as issue creation, should remain behind an explicit confirmation UI in production.

## Security model

Every session, message, tool-log, and attachment operation verifies ownership against the authenticated user. Documents are uploaded from the server to managed storage; the database stores only the object reference and metadata.

## License

MIT
