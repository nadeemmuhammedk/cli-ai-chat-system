# CLI AI Chat System

A unified session management system for AI CLI tools (Claude, Gemini, Codex) that organizes conversations into structured sessions with context tracking, decision logging, and artifact management.

## What It Does

CLI AI Chat System provides a disciplined approach to AI-assisted development:

- **Session Organization** - Each conversation gets its own folder with artifacts, context, and decision tracking
- **Multi-Platform Support** - Works seamlessly across Claude, Gemini, and Codex
- **Planning Mode** - Built-in task tracking for complex multi-phase work
- **Session Registry** - Central tracking of all sessions with status management
- **Checkpoint System** - Save progress with AI-generated summaries and decisions

## Installation

No installation required! Use `npx` to run directly.

### Initialize All Platforms

```bash
# Navigate to your project directory
cd my-project

# Initialize with all platforms (Claude, Gemini, Codex)
npx cli-ai-chat-system init
```

This sets up:
- `.claude/commands/` - Custom slash commands for session management
- `.gemini/commands/` - Custom slash commands for Gemini (PowerShell-compatible)
- `.codex/commands/` - Custom slash commands for Codex
- `_templates/session/` - Template files for new sessions
- `.cli-ai-chat/` - Session registry and active session tracking

### Initialize Single Platform Only

If you only use one AI platform, install just what you need:

```bash
# Claude only
npx cli-ai-chat-system init claude

# Gemini only
npx cli-ai-chat-system init gemini

# Codex only
npx cli-ai-chat-system init codex
```

### Update Existing Project

To update system files to the latest version:

```bash
# Navigate to your existing project
cd my-project

# Update all installed platforms
npx cli-ai-chat-system update

# Or update a specific platform
npx cli-ai-chat-system update claude
npx cli-ai-chat-system update gemini
npx cli-ai-chat-system update codex
```

**What gets updated:**
- Slash commands (`.claude/commands/`, `.gemini/commands/`, `.codex/commands/`)
- Session templates (`_templates/session/`)
- System documentation (`CLAUDE.md`)

**What is preserved:**
- Your sessions (`chats/`, `unnamed_projects/`)
- Session registry (`.cli-ai-chat/sessions.json`)
- Active session pointer (`.cli-ai-chat/active-session.txt`)

## Requirements

- **Node.js** >= 14.0.0
- **jq** - JSON processor for command-line operations
  - Windows: `choco install jq`
  - Mac/Linux: `brew install jq`

## Using Session Commands

After initialization, use slash commands in your AI chat:

```bash
# Start a new session
/new-session [project-name] [session-topic]
# Example: /new-session my-website seo-optimization
# Creates: chats/projects/my-website/2025-03-02-seo-optimization/

# Save progress
/checkpoint

# Resume a previous session
/continue-session

# Start planning mode for complex work
/start-plan [plan-name]

# End the session
/end-session
```

## Session Structure

Each session creates an organized folder structure:

```
chats/
├── projects/
│   └── [project-name]/
│       └── YYYY-MM-DD-[topic]/
│           ├── artifacts/          # Generated outputs
│           ├── core_files/         # Reference materials
│           ├── core_instructions/  # Rules to follow
│           ├── uploaded_files/     # User-provided inputs
│           ├── planning_mode/      # Multi-phase work tracking
│           │   ├── archive/
│           │   ├── YYYY-MM-DD-name-plan.md
│           │   ├── YYYY-MM-DD-name-todo.md
│           │   └── YYYY-MM-DD-name-done.md
│           ├── context.md          # Session overview
│           ├── messages.md         # Conversation summary
│           └── decisions.md        # Decision tree with rationale
└── unnamed_projects/
    └── YYYY-MM-DD-[topic]/
        └── [same structure]
```

## Available Commands

| Command | Description |
|---------|-------------|
| `/new-session [project-name] [session-topic]` | Create a new session in `chats/projects/[project-name]/YYYY-MM-DD-[session-topic]/` |
| `/new-session [session-topic]` | Create a session without a project in `unnamed_projects/YYYY-MM-DD-[session-topic]/` |
| `/checkpoint` | Save progress with AI-generated summary |
| `/continue-session` | Resume a previous session |
| `/start-plan [plan-name]` | Activate planning mode for complex work |
| `/end-session` | Finalize and close the active session |

## Session Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    /new-session                              │
│                    Creates session folder                    │
│                    Sets status: in-progress                  │
├─────────────────────────────────────────────────────────────┤
│                    Work Session                              │
│                    • Use /checkpoint periodically            │
│                    • Use /start-plan for complex work        │
│                    • Artifacts saved to artifacts/           │
├─────────────────────────────────────────────────────────────┤
│                    /end-session                              │
│                    • Final summary generated                 │
│                    • Status: completed/paused/abandoned      │
│                    • Active pointer cleared                  │
└─────────────────────────────────────────────────────────────┘
```

## Planning Mode

For complex multi-phase work, use `/start-plan` to create:

- **plan.md** - Master plan with goals, approach, and phases
- **todo.md** - Active task list organized by phase
- **done.md** - Completion log

The AI automatically:
- References the plan before major work
- Updates todo.md as tasks progress
- Moves completed tasks to done.md
- Alerts you if work deviates from the plan

## Platform-Specific Notes

### Gemini (Windows)
The `.gemini/commands/` use PowerShell scripts instead of bash, since Gemini natively supports Windows PowerShell.

### Claude & Codex
The `.claude/commands/` and `.codex/commands/` use bash scripts with `jq` for JSON operations.

## Package Contents

```
cli-ai-chat-system/
├── bin/
│   └── cli-ai-chat-system.js    # CLI entry point
├── template/
│   ├── .claude/commands/         # Claude slash commands
│   ├── .gemini/commands/         # Gemini slash commands (PowerShell)
│   ├── .codex/commands/          # Codex slash commands
│   ├── _templates/session/       # Session file templates
│   ├── CLAUDE.md                 # System documentation
│   └── README.md                 # User guide
├── package.json
└── README.md
```

## Links

- **GitHub:** https://github.com/nadeemmuhammedk/cli-ai-chat-system
- **npm:** https://www.npmjs.com/package/cli-ai-chat-system

## Keywords

ai, chat, claude, gemini, codex, chatgpt, session, management, cli, scaffolding, template, ai-development, claude-code, session-tracking, multi-platform

## License

ISC
