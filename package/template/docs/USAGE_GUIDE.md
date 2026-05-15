# Usage Guide

## Installation

### Install All Platforms
```bash
cd your-project
npx cli-ai-chat-system init
```

### Install a Specific Platform
```bash
npx cli-ai-chat-system init claude   # Claude only
npx cli-ai-chat-system init gemini   # Gemini only
npx cli-ai-chat-system init codex    # Codex only
```

### Add a Platform Later
If you initially installed Claude only and want to add Gemini:
```bash
npx cli-ai-chat-system init gemini
```
This adds the Gemini commands without touching your existing Claude setup or session data.

---

## Basic Session Workflow

### 1. Start a Session

With a project name:
```
/new-session spanshades seo-research
```
Creates: `chats/projects/spanshades/2025-01-20-seo-research/`

Without a project (one-off task):
```
/new-session quick-debugging
```
Creates: `chats/unnamed_projects/2025-01-20-quick-debugging/`

**Naming rules:** Both project and topic must be kebab-case (lowercase, hyphens, numbers only).
- ✅ `seo-research`, `bug-fix-123`, `api-refactor`
- ❌ `SEO Research`, `seoResearch`, `seo_research`

### 2. Do Your Work

The AI will save generated files to `artifacts/` automatically.

Use explicit folders when instructed:
- `core-files/` — reference documents for the AI to follow
- `core-instructions/` — rules the AI must adhere to
- `uploaded-files/` — files you provide as input

### 3. Save a Checkpoint

```
/checkpoint
```

The AI will:
1. Analyze the conversation since the last checkpoint
2. Generate a summary, decisions, and context changes
3. Present them for your validation (select accurate items)
4. Update `context.md`, `messages.md`, and `decisions.md`

### 4. End the Session

```
/end-session
```

The AI performs a final checkpoint, asks for the session status (Completed / Paused / Abandoned), then finalizes all files and clears the active session pointer.

---

## Resuming Sessions

### Continue a Paused Session

```
/continue-session
```

Displays all paused/in-progress sessions grouped by project:
```
📋 Available Sessions:

spanshades:
  [1] 2025-01-20-seo-research [paused]
  [2] 2025-01-18-keyword-audit [paused]

Unnamed Projects:
  [3] 2025-01-17-quick-debug [paused]

Enter session number:
```

Type the number to resume that session. The AI reads `context.md` to restore full context.

---

## Planning Mode

For complex, multi-phase work:

### Activate Planning Mode

```
/start-plan database-migration
```

Creates three files in `planning-mode/`:
- `2025-01-20-database-migration-plan.md` — fill in goals, phases, approach
- `2025-01-20-database-migration-todo.md` — tasks organized by phase
- `2025-01-20-database-migration-done.md` — completed tasks log

### How It Works

Once activated, the AI automatically:
- Reads `plan.md` before starting major work
- Updates `todo.md` as tasks are completed
- Moves finished tasks to `done.md` with timestamps
- Alerts you during `/checkpoint` if work has deviated from the plan

### Starting a New Planning Cycle

Running `/start-plan` again archives the current planning files to `planning-mode/archive/` and creates fresh ones.

---

## Cross-Platform Usage

Sessions are shared across platforms. Example workflow:

**Terminal 1 (Claude):**
```
/new-session api-project refactoring
[work in Claude...]
/checkpoint
```

**Terminal 2 (Gemini):**
```
/continue-session
[select the same session]
[work continues in Gemini...]
/checkpoint
```

**Terminal 3 (Codex):**
```
/continue-session
[select the same session]
[work continues in Codex...]
/end-session
```

The `platform` field in `sessions.json` tracks which AI last worked on each session.

---

## Updating the System

```bash
npx cli-ai-chat-system update
```

Updates all installed platform commands and documentation files. Your session data is never touched.

Update a specific platform only:
```bash
npx cli-ai-chat-system update claude
npx cli-ai-chat-system update gemini
```

---

## File Reference

| File | Modified by | Purpose |
|------|------------|---------|
| `.cli-ai-chat/sessions.json` | Commands | Session registry |
| `.cli-ai-chat/active-session.txt` | Commands | Active session pointer |
| `chats/[project]/[session]/context.md` | `/checkpoint` | Session overview |
| `chats/[project]/[session]/messages.md` | `/checkpoint` | Conversation log |
| `chats/[project]/[session]/decisions.md` | `/checkpoint` | Decision tree |
| `chats/[project]/[session]/artifacts/` | AI (automatic) | Generated outputs |
| `CLAUDE.md` | `update` | Claude guidance (auto-generated) |
| `GEMINI.md` | `update` | Gemini guidance (auto-generated) |
| `AGENTS.md` | `update` | Codex guidance (auto-generated) |

---

## Troubleshooting

**"jq is not installed"**
Install jq: `choco install jq` (Windows) or `apt install jq` (Linux/WSL) or `brew install jq` (Mac).

**"Template files missing in _templates/session/"**
Run `npx cli-ai-chat-system update` to restore missing template files.

**"No active session found"**
Run `/new-session` to create a session or `/continue-session` to resume one.

**Session registry is empty after switching platforms**
All platforms read from `.cli-ai-chat/sessions.json`. If that file is missing, run `npx cli-ai-chat-system update` to restore it (an empty registry will be created; your sessions in `chats/` are unaffected).
