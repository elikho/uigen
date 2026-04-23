# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup          # First-time setup: install deps + prisma generate + migrate
npm run dev            # Start dev server (Turbopack) on http://localhost:3000
npm run build          # Production build
npm run lint           # ESLint via Next.js config
npm run test           # Run all tests with Vitest
npm run db:reset       # Reset SQLite database (--force)
```

Run a single test file:
```bash
npm test -- src/components/chat/__tests__/ChatInterface.test.tsx
npm test -- file-system.test   # pattern match
```

## Environment

Copy `.env` and set `ANTHROPIC_API_KEY`. If the key is absent, the app uses a `MockLanguageModel` — the UI is fully functional but component generation returns static output.

Database is SQLite at `prisma/dev.db`. Client is generated to `src/generated/prisma`.

## Architecture

UIGen is an AI-powered React component generator. Users chat with Claude, which generates/edits files in an in-memory virtual file system. The generated code is rendered live in an iframe using in-browser Babel transpilation.

### Request Flow

```
User prompt
  → ChatInterface (useChat hook from @ai-sdk/react)
  → POST /api/chat
  → Claude (claude-haiku-4-5) with tool use, up to 40 steps
  → str_replace_editor / file_manager tools mutate VirtualFileSystem
  → FileSystemContext notifies components
  → CodeEditor / PreviewFrame re-render
  → onFinish: authenticated users auto-save to Project (Prisma/SQLite)
```

### Key Modules

**`src/lib/file-system.ts`** — `VirtualFileSystem` class: entirely in-memory Map-based tree. No disk I/O. Serializes to/from JSON for database persistence. Auto-creates parent directories.

**`src/lib/tools/`** — Two Vercel AI SDK tools:
- `str-replace.ts` — `str_replace_editor`: view, create, str_replace, insert operations
- `file-manager.ts` — `file_manager`: rename, delete operations

**`src/app/api/chat/route.ts`** — Streaming endpoint. Reconstructs `VirtualFileSystem` from request state each call, runs tools, streams back deltas.

**`src/lib/prompts/generation.tsx`** — System prompt that instructs Claude to always create `App.jsx` first and use a specific file structure.

**`src/components/preview/PreviewFrame.tsx`** — Renders `App.jsx` in an iframe. Uses `@babel/standalone` to transpile JSX at runtime. Hot-reloads on file changes.

**`src/components/editor/`** — Monaco editor + file tree. Reads from `FileSystemContext`.

**`src/lib/auth.ts`** — JWT sessions via `jose`, 7-day expiry, httpOnly cookies. Passwords hashed with bcrypt. Anonymous work tracked in localStorage via `anon-work-tracker.ts`.

### Layout

Main workspace (`main-content.tsx`): left 35% chat panel, right 65% toggleable preview/code panel. Panels are resizable via `react-resizable-panels`.

Routes:
- `/` — Home/landing; redirects authenticated users to their projects
- `/[projectId]` — Project workspace (authenticated only)
- `/api/chat` — Streaming chat endpoint
- `/api/projects`, `/api/filesystem` — Protected by JWT middleware

### Data Persistence

- **Anonymous users**: work stored in localStorage
- **Authenticated users**: `Project.messages` (JSON) + `Project.data` (serialized VirtualFileSystem JSON) saved on chat completion
- Prisma schema: `User` → many `Project`s; both with optional `userId` for shared/public projects

## Tech Stack

- **Next.js 15** (App Router, Turbopack), **React 19**, **TypeScript 5**
- **Vercel AI SDK** (`ai` + `@ai-sdk/anthropic`) for streaming and tool use; prompt caching enabled
- **Tailwind CSS v4**, **Radix UI**, **shadcn/ui** (new-york style), **Monaco Editor**
- **Prisma 6** with SQLite
- **Vitest** + **@testing-library/react** (jsdom environment)
- Path alias: `@/*` → `src/*`
