# CLI AI Chat System

A unified session management system for AI CLI tools. Organize your AI conversations into structured sessions with context tracking, decision logging, and artifact management — across Claude, Gemini, and Codex.

## Quick Start

```bash
# Install all platforms
npx cli-ai-chat-system init

# Install a specific platform
npx cli-ai-chat-system init claude
npx cli-ai-chat-system init gemini
npx cli-ai-chat-system init codex
```

Then open your AI CLI and start your first session:

```
/new-session my-project first-session
```

## Commands

### CLI Tool Commands

| Command | Description |
|---------|-------------|
| `npx cli-ai-chat-system init` | Install all platforms |
| `npx cli-ai-chat-system init [platform]` | Install a specific platform |
| `npx cli-ai-chat-system update` | Update all installed platforms |
| `npx cli-ai-chat-system update [platform]` | Update a specific platform |
| `npx cli-ai-chat-system platform` | Show installed/available platforms |
| `npx cli-ai-chat-system help` | Show help |

Platforms: `claude`, `gemini`, `codex`

### Session Commands (inside your AI CLI)

| Command | Description |
|---------|-------------|
| `/new-session [project] [topic]` | Start a new session |
| `/checkpoint` | Save progress |
| `/continue-session` | Resume a paused session |
| `/end-session` | Finalize the active session |
| `/start-plan [name]` | Activate planning mode |

## Session Structure

Sessions are stored in `chats/` and organized by project:

```
chats/
├── projects/
│   └── my-project/
│       └── 2025-01-20-feature-x/
│           ├── artifacts/         ← your generated files
│           ├── context.md         ← what this session is about
│           ├── messages.md        ← conversation summary
│           └── decisions.md       ← key decisions made
└── unnamed_projects/
    └── 2025-01-20-quick-task/
```

## Typical Workflow

```bash
# 1. Start a session
/new-session spanshades seo-research

# 2. Do your work — AI saves outputs to artifacts/

# 3. Save a checkpoint periodically
/checkpoint

# 4. End the session when done
/end-session

# 5. Resume later
/continue-session
```

## Planning Mode

For complex multi-phase work:

```bash
/new-session api-project refactoring
/start-plan database-migration
```

Creates:
- `plan.md` — goals, phases, approach
- `todo.md` — tasks by phase
- `done.md` — completed tasks log

The AI automatically tracks progress and alerts you if work deviates from the plan.

## Cross-Platform Sessions

Sessions are shared across all platforms via `.cli-ai-chat/sessions.json`. Start a session in Claude and continue it in Gemini — the context carries over.

## Updating

```bash
npx cli-ai-chat-system update
```

Updates system files and command definitions. Your session data in `chats/` and `.cli-ai-chat/sessions.json` is never touched.

## Platform Reference

| Platform | Commands | Doc File |
|----------|----------|----------|
| Claude | `.claude/commands/*.md` | `CLAUDE.md` |
| Gemini | `.gemini/commands/*.toml` | `GEMINI.md` |
| Codex | `.codex/commands/*.yaml` | `AGENTS.md` |

See `SYSTEM.md` for full architecture documentation.
