# CLI AI Chat System — System Documentation

## Overview

The CLI AI Chat System is a unified session management framework for AI CLI tools. It provides structured, persistent chat sessions with context tracking, decision logging, and artifact management across Claude, Gemini, and Codex platforms.

## Architecture

### Unified Registry

All platforms share a single session registry stored in `.cli-ai-chat/`:

```
.cli-ai-chat/
├── sessions.json       # All sessions across all platforms
└── active-session.txt  # Currently active session path
```

Sessions created in Claude can be continued in Gemini or Codex. The `platform` field in each session entry tracks which AI last worked on it.

### Platform Configuration

Each platform has its own command directory (commands only — no session data):

```
.claude/commands/     # Claude slash commands (.md format)
.gemini/commands/     # Gemini slash commands (.toml format)
.codex/commands/      # Codex slash commands (.yaml format)
```

### Session Storage

All session data lives in `chats/`, shared across platforms:

```
chats/
├── projects/
│   └── [project-name]/
│       └── YYYY-MM-DD-[topic]/
│           ├── artifacts/
│           ├── core_files/
│           ├── core_instructions/
│           ├── uploaded_files/
│           ├── planning_mode/
│           │   ├── archive/
│           │   ├── YYYY-MM-DD-name-plan.md
│           │   ├── YYYY-MM-DD-name-todo.md
│           │   └── YYYY-MM-DD-name-done.md
│           ├── context.md
│           ├── messages.md
│           └── decisions.md
└── unnamed_projects/
    └── YYYY-MM-DD-[topic]/
```

### Session Templates

Shared templates in `_templates/session/` are used when creating new sessions:

- `context-template.md` — Session overview template
- `messages-template.md` — Conversation log template
- `decisions-template.md` — Decision tree template

## Session Registry Schema

```json
{
  "sessions": [
    {
      "path": "chats/projects/[project]/[date]-[topic]",
      "topic": "topic-name",
      "project": "project-name",
      "status": "in-progress|paused|completed|abandoned",
      "platform": "claude|gemini|codex",
      "created": "2025-01-20T10:00:00Z",
      "lastActive": "2025-01-20T14:30:00Z"
    }
  ]
}
```

## Commands

All platforms support the same 5 core commands:

| Command | Description |
|---------|-------------|
| `/new-session [project] [topic]` | Create a new session |
| `/checkpoint` | Save progress with AI-generated summary |
| `/continue-session` | Resume a paused session |
| `/end-session` | Finalize and close the active session |
| `/start-plan [name]` | Activate planning mode |

### Command Format by Platform

| Platform | Format | Location |
|----------|--------|----------|
| Claude | Markdown (`.md`) | `.claude/commands/` |
| Gemini | TOML (`.toml`) | `.gemini/commands/` |
| Codex | YAML (`.yaml`) | `.codex/commands/` |

## Session Lifecycle

```
/new-session project topic
      ↓
  [work cycle]
      ↓
  /checkpoint  ← repeat as needed
      ↓
  /end-session
```

### Status Transitions

```
created → in-progress
in-progress → paused      (when /new-session or /continue-session switches away)
paused → in-progress      (when /continue-session selects it)
in-progress → completed   (when /end-session with "Completed")
in-progress → abandoned   (when /end-session with "Abandoned")
```

## Planning Mode

Activated by `/start-plan [name]`. Creates three files in `planning_mode/`:

| File | Purpose |
|------|---------|
| `YYYY-MM-DD-name-plan.md` | Master plan with goals, phases, constraints |
| `YYYY-MM-DD-name-todo.md` | Active task list by phase |
| `YYYY-MM-DD-name-done.md` | Completed tasks log |

**Automatic behaviors when planning mode is active:**
- AI reads `plan.md` before starting major work
- AI updates `todo.md` as tasks progress
- AI moves completed tasks to `done.md` with timestamps
- AI alerts user if work deviates from the plan
- `/checkpoint` includes a planning status check

**Starting a new planning cycle** archives existing planning files to `planning_mode/archive/`.

## Cross-Platform Session Continuity

Sessions are platform-agnostic. The workflow:

1. Start session in Claude: `/new-session myproject feature-x`
   - Creates session in `chats/projects/myproject/2025-01-20-feature-x/`
   - Writes to `.cli-ai-chat/sessions.json` with `"platform": "claude"`

2. Continue in Gemini: `/continue-session`
   - Reads same `.cli-ai-chat/sessions.json`
   - Displays session in list
   - Updates `platform` to `"gemini"` on activation

3. Continue in Codex: same pattern

The `active-session.txt` pointer is shared, so only one AI can have an "active" session at a time. Switching platforms automatically pauses the previous session.

## Documentation Files

| File | Purpose | Maintained by |
|------|---------|---------------|
| `CLAUDE.md` | Claude-specific AI guidance | Auto-generated (source: `CLAUDE.md` template) |
| `GEMINI.md` | Gemini-specific AI guidance | Auto-generated (derived from `CLAUDE.md`) |
| `AGENTS.md` | Codex-specific AI guidance | Auto-generated (derived from `CLAUDE.md`) |
| `SYSTEM.md` | This file — system architecture reference | Auto-updated |
| `README.md` | User-facing documentation | Auto-updated |

## Updating the System

```bash
npx cli-ai-chat-system update
```

What gets updated:
- Platform command files (`.claude/`, `.gemini/`, `.codex/`)
- Platform doc files (`CLAUDE.md`, `GEMINI.md`, `AGENTS.md`)
- Session templates (`_templates/session/`)
- System docs (`SYSTEM.md`, `README.md`, `docs/`)

What is preserved:
- `.cli-ai-chat/sessions.json` — your session registry
- `.cli-ai-chat/active-session.txt` — active session pointer
- `chats/` — all session data and artifacts
