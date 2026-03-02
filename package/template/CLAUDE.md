# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Overview

This is a unified session management system for AI CLI tools that organizes conversations into structured sessions with context tracking, decision logging, and artifact management. The system uses custom slash commands to create, manage, and track AI chat sessions across projects.

## System Architecture

### Core Components

**Session Registry** (`.cli-ai-chat/sessions.json`)
- Central registry tracking all sessions across all platforms
- Stores session metadata: path, topic, project, status, platform, timestamps
- Updated by `/new-session`, `/continue-session`, `/end-session` commands

**Active Session Pointer** (`.cli-ai-chat/active-session.txt`)
- Single file tracking the currently active session
- Contains relative path to active session folder
- Shared across Claude, Gemini, and Codex — one active session at a time

**Slash Commands** (`.claude/commands/*.md`)
- Custom commands that expand to prompts for session management
- Each command is self-documenting with description frontmatter

### Session Folder Structure

```
chats/
├── projects/
│   └── [project-name]/
│       └── YYYY-MM-DD-[topic]/
│           ├── artifacts/          # Generated outputs
│           ├── core_files/         # Reference materials (explicit only)
│           ├── core_instructions/  # Rules to follow (explicit only)
│           ├── uploaded_files/     # User-provided inputs
│           ├── planning_mode/      # Multi-phase work tracking
│           │   ├── archive/
│           │   ├── YYYY-MM-DD-name-plan.md
│           │   ├── YYYY-MM-DD-name-todo.md
│           │   └── YYYY-MM-DD-name-done.md
│           ├── context.md          # High-level session overview
│           ├── messages.md         # Conversation summary
│           └── decisions.md        # Decision tree with rationale
└── unnamed_projects/
    └── YYYY-MM-DD-[topic]/
        └── [same structure]
```

## Key Design Decisions

### Single Active Session Model
- One active session per working directory (not per terminal)
- Session registry (`.cli-ai-chat/`) is shared across all AI platforms
- Previous sessions marked as "paused" when starting a new session

### Unified Registry
- All platforms write to `.cli-ai-chat/sessions.json`
- Each session has a `platform` field tracking which AI last worked on it
- Sessions started in Claude can be continued in Gemini or Codex and vice versa

### Explicit Folder Population
- `core_files/`, `core_instructions/`, `uploaded_files/` created empty
- Only populated when user explicitly instructs
- Planning mode activated only via `/start-plan` command

### Decision Tree Format
- Nested markdown structure shows decision hierarchy
- Tracks abandoned paths for historical context
- Only direction-changing choices are logged, not every question

## Session Management Commands

### Creating Sessions
- `/new-session [project] [topic]` — Create project-based session
- `/new-session [topic]` — Create in unnamed_projects
- Auto-pauses any currently active session

### Working with Sessions
- `/checkpoint` — Save progress with AI-generated content validation
- `/start-plan [name]` — Activate planning mode for complex multi-phase work

### Navigating Sessions
- `/continue-session` — Resume a paused session (displays list)
- `/end-session` — Finalize and close the active session

## Important Behaviors

### Checkpoint Process
When `/checkpoint` is invoked:
1. Analyze conversation since last checkpoint
2. Generate draft content (summary, decisions, context changes)
3. Present for validation — user selects accurate items
4. If planning mode active: check for deviations from plan
5. Update all session files with validated content and fresh timestamps

### Planning Mode
Activated only when user runs `/start-plan [name]`:
- Creates `plan.md` (master plan), `todo.md` (active tasks), `done.md` (completion log)
- Claude automatically references `plan.md` before major work
- Real-time updates to todo/done files as work progresses
- Alerts user if work deviates from the documented plan

### Core Instructions
If `core_instructions/` contains files:
- Check them before major decisions
- Warn user if a request conflicts with instructions
- Never deviate without explicit user permission

## File Roles

| File | Purpose |
|------|---------|
| `context.md` | What the session is about (high-level, <200 words) |
| `messages.md` | What was discussed (chronological summary) |
| `decisions.md` | Why choices were made (decision rationale tree) |
| `artifacts/` | Generated work products |
| `core_files/` | Authoritative references to follow |
| `core_instructions/` | Irrefutable rules and standards |
| `uploaded_files/` | User-provided input files for analysis |
| `planning_mode/` | Tactical plan and progress tracking |

## Common Workflows

### Standard Session Lifecycle
```
/new-session spanshades seo-optimization
[Work normally, create artifacts in artifacts/]
/checkpoint  ← periodically
/end-session ← when complete
```

### Complex Multi-Phase Work
```
/new-session api-system refactoring
/start-plan database-migration
[Work progresses, todo.md updated automatically]
/checkpoint
/end-session
```

### Resuming Previous Work
```
/continue-session
[Select from numbered list of sessions]
/checkpoint
```

## Technical Notes

### Command Execution
- Slash commands use bash scripts with `jq` for JSON operations
- All file operations optimized with `heredocs`, `sed`, and `grep`
- Session tracking via `.cli-ai-chat/active-session.txt` (single fixed pointer)
- All registry updates use atomic `jq` operations (write to `.tmp` then `mv`)

### Session Registry Updates
Always update `.cli-ai-chat/sessions.json` when:
- Creating new session → `status: "in-progress"`, `platform: "claude"`
- Pausing session → `status: "paused"`
- Ending session → `status: "completed"` or `"abandoned"`
- Continuing session → update `lastActive` timestamp

### Date Formats
- Session folders: `YYYY-MM-DD-topic-name` (kebab-case)
- Timestamps in files: ISO-8601 format (`2025-01-20T14:30:00Z`)
- Planning files: `YYYY-MM-DD-name-{plan,todo,done}.md`

## Critical Rules
- Never create planning files automatically (only via `/start-plan`)
- Never populate `core_files/` or `core_instructions/` proactively
- Always mark previous session as paused when creating a new session
- Always use `.cli-ai-chat/active-session.txt` for session tracking
- Update session registry on every status change
- Use bash with `jq` for all JSON operations (atomic updates)
- Never read files before appending — use `cat >>` directly
