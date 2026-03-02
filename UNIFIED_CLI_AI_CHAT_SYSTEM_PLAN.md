# Unified CLI AI Chat System Implementation Plan

## Context

This plan creates a new npm package called `cli-ai-chat-system` that provides a unified session management system for AI chat interfaces (Claude, Gemini, ChatGPT).

**Design Principle:** The new system should be **EXACTLY the same** as the existing Claude CLI chat system, with **ONLY ONE exception**:

- **Everything is identical to Claude system**: commands, documentation, session structure, templates
- **ONLY difference**: Registry location (`.claude/` → `.cli-ai-chat/`)

The package follows the same structure as `appsheet-project` (npm package with CLI tool), but provides a chat-focused session management system that can work across different AI platforms.

**Important:** The existing Claude CLI chat system at `AI Chats/claude_cli_chat\` is currently stable and in use. This new system will create a NEW package at a separate location (`cli-ai-chat-system/`) and will NOT modify or break the existing Claude system. The session registry locations are different:
- **Existing Claude system**: `.claude/sessions.json` and `.claude/active-session.txt`
- **New unified system**: `.cli-ai-chat/sessions.json` and `.cli-ai-chat/active-session.txt`

This plan is for reference only - the actual implementation will be done by the user later in detail.

## Implementation Approach

### Package Structure

```
cli-ai-chat-system/
├── package.json
├── .npmignore
├── bin/
│   └── cli-ai-chat-system.js    # CLI entry point (init, update, help, platform)
├── template/
│   ├── .cli-ai-chat/            # Unified session registry (SHARED across platforms)
│   │   ├── sessions.json          # Unified session registry with platform field
│   │   └── active-session.txt    # Single active session pointer
│   ├── .claude/                  # Claude platform config (commands only)
│   │   └── commands/              # 5 markdown commands
│   ├── .gemini/                 # Gemini platform config (commands only)
│   │   └── commands/              # 8 TOML commands
│   ├── .codex/                  # Codex (ChatGPT) platform config (commands only)
│   │   └── commands/              # 8 YAML commands
│   ├── _templates/session/         # Shared session templates
│   │   ├── context-template.md
│   │   ├── messages-template.md
│   │   └── decisions-template.md
│   ├── CLAUDE.md                 # Claude-specific guidance (EXACT copy from existing system)
│   ├── GEMINI.md                 # Gemini-specific guidance (from existing system)
│   ├── AGENTS.md                 # Codex/ChatGPT-specific guidance (adapted from existing)
│   ├── SYSTEM.md                  # Master system documentation
│   ├── README.md                  # User documentation
│   └── .gitignore
└── docs/
    ├── PLATFORM_COMMAND_FORMATS.md  # Command format reference
    └── USAGE_GUIDE.md            # Comprehensive usage guide
```

**Note**: Claude platform files are EXACT copies from the existing stable system. The ONLY change needed: update registry path references from `.claude/` to `.cli-ai-chat/` in all commands.

### Key Design Decisions

1. **Shared Session Storage**: All platforms use the same `chats/` directory structure (identical to Claude CLI chat)

2. **Unified Session Registry**: Single `.cli-ai-chat/` directory contains:
   - `sessions.json` - Unified registry tracking all sessions across platforms
   - `active-session.txt` - Single active session pointer (one session active at a time, regardless of platform)
   - Each session includes a `platform` field to identify which AI was used

3. **Claude Platform - EXACT Copy**: The Claude platform in the new package is EXACTLY the same as the existing stable Claude CLI chat system, with ONLY ONE change:
   - Commands are IDENTICAL (markdown format)
   - Documentation is IDENTICAL
   - Session structure is IDENTICAL
   - Templates are IDENTICAL
   - **ONLY CHANGE**: `.claude/sessions.json` → `.cli-ai-chat/sessions.json`
   - **ONLY CHANGE**: `.claude/active-session.txt` → `.cli-ai-chat/active-session.txt`
   - **NOTE**: All Claude commands must have these registry references updated

4. **Gemini & Codex Platforms**: Adapted from Claude but with different command formats:
   - Gemini: TOML format commands (from existing Gemini system)
   - Codex: YAML format commands (adapted from Gemini)
   - Both use same `.cli-ai-chat/` registry as Claude

5. **Platform-Optimized Commands**:
   - Claude: Markdown commands with detailed bash scripts (from existing system)
   - Gemini: TOML commands with numbered selection (from existing system)
   - Codex (ChatGPT): YAML commands with inline validation (NEW)

### Command Set

**Core Commands (All Platforms):**
1. `new-session` - Create new session
2. `checkpoint` - Save progress
3. `continue-session` - Resume session
4. `end-session` - Finalize session
5. `start-plan` - Activate planning mode

**Extended Commands (Gemini & Codex only):**
6. `list-sessions` - Display all sessions
7. `switch-session` - Quick switch between sessions
8. `save-artifact` - Manual artifact saving

### Documentation Template System

The CLI tool generates platform-specific documentation files from a single template during `init`:

**Placeholders in PLATFORM-TEMPLATE.md:**
| Placeholder | Claude Value | Gemini Value | Codex Value |
|------------|--------------|---------------|--------------|
| `{{PLATFORM_DIR}}` | `.claude/` | `.gemini/` | `.codex/` |
| `{{COMMAND_EXT}}` | `.md` | `.toml` | `.yaml` |
| `{{PLATFORM_NAME}}` | Claude | Gemini | ChatGPT |
| `{{DOC_FILE}}` | CLAUDE.md | GEMINI.md | AGENTS.md |
| `{{COMMAND_REF}}` | `.claude/commands/*.md` | `.gemini/commands/*.toml` | `.codex/commands/*.yaml` |

**Generated Files:**
- `CLAUDE.md` - For Claude CLI (from template with Claude placeholders)
- `GEMINI.md` - For Gemini CLI (from template with Gemini placeholders)
- `AGENTS.md` - For ChatGPT/Codex CLI (from template with Codex placeholders)

**Benefits:**
- Single source of truth for documentation
- Platform-specific files are generated, not maintained separately
- Easy to update documentation - modify one template, all platforms benefit

### Unified Session Registry Schema

The unified `sessions.json` includes a `platform` field:

```json
{
  "sessions": [
    {
      "path": "chats/projects/[project]/[date]-[topic]",
      "topic": "topic-name",
      "project": "project-name",
      "status": "in-progress|paused|completed|abandoned",
      "platform": "claude|gemini|codex",
      "created": "ISO-8601-timestamp",
      "lastActive": "ISO-8601-timestamp"
    }
  ]
}
```

**Key Points:**
- One active session at a time (via single `active-session.txt`)
- When switching platforms in different terminals, the session continues seamlessly
- The `platform` field tracks which AI last worked on the session
- All commands across platforms reference `.cli-ai-chat/sessions.json` and `.cli-ai-chat/active-session.txt`

### CLI Tool Commands

The CLI tool (`cli-ai-chat-system`) provides:

1. **`init [platform]`** - Initialize chat system in current directory
   - **No argument (default)**: Install ALL platforms (Claude, Gemini, Codex)
   - **With argument (`claude` | `gemini` | `codex`)**: Install ONLY the specified platform
   - Copy selected platform configuration directories
   - Copy shared session templates
   - Copy documentation files for installed platforms
   - Create other documentation files (SYSTEM.md, README.md, docs/)
   - Create version tracking file

   **Examples:**
   - `npx cli-ai-chat-system init` → Install all platforms
   - `npx cli-ai-chat-system init claude` → Install Claude only
   - `npx cli-ai-chat-system init gemini` → Install Gemini only
   - `npx cli-ai-chat-system init codex` → Install Codex only

2. **`update [platform]`** - Update existing project
   - **No argument (default)**: Update ALL installed platforms
   - **With argument (`claude` | `gemini` | `codex`)**: Update ONLY the specified platform
   - Update system files with latest templates
   - Preserve user sessions and data
   - Version comparison

3. **`help`** - Display usage instructions
   - Show command syntax
   - List available platforms
   - Quick reference card

4. **`platform`** - Platform management
   - Show installed platforms (which `.claude/`, `.gemini/`, `.codex/` exist)
   - Show available platforms (claude, gemini, codex)
   - Display command format differences
   - Explain how to add missing platforms

## Files to Create

### Root Level
- `package.json` - npm package configuration
- `.npmignore` - npm publish exclusions

### CLI Tool
- `bin/cli-ai-chat-system.js` - Main CLI entry point

### Unified Session Registry (NEW)
Create in `template/.cli-ai-chat/`:
- `sessions.json` - Unified registry template with platform field
- `active-session.txt` - Single active session pointer template

### Claude Platform (EXACT copy from existing system, with ONE change)
Copy from `F:/Work/Projects/AI Chats/claude_cli_chat/`:
- `CLAUDE.md` - **EXACT COPY**, then **MODIFY**: Update registry path from `.claude/` to `.cli-ai-chat/`
- `SYSTEM.md` - **EXACT COPY**, then **MODIFY**: Update registry path references if needed
- `_templates/session/` - **EXACT COPY** (all templates identical)
- `commands/new-session.md` - **EXACT COPY**, then **MODIFY**: Use `.cli-ai-chat/sessions.json` instead of `.claude/sessions.json`, add platform="claude" field
- `commands/checkpoint.md` - **EXACT COPY**, then **MODIFY**: Use `.cli-ai-chat/` instead of `.claude/`
- `commands/continue-session.md` - **EXACT COPY**, then **MODIFY**: Use `.cli-ai-chat/` instead of `.claude/`
- `commands/end-session.md` - **EXACT COPY**, then **MODIFY**: Use `.cli-ai-chat/` instead of `.claude/`
- `commands/start-plan.md` - **EXACT COPY**, then **MODIFY**: Use `.cli-ai-chat/` instead of `.claude/`

### Gemini Platform (commands only - from existing system)
Copy from `F:/Work/Projects/AI Chats/gemini_cli_chat/.gemini/`:
- `commands/new-session.toml` - **MODIFY**: Use `.cli-ai-chat/sessions.json` and add platform field
- `commands/checkpoint.toml` - **MODIFY**: Use `.cli-ai-chat/sessions.json`
- `commands/continue-session.toml` - **MODIFY**: Use `.cli-ai-chat/sessions.json`
- `commands/end-session.toml` - **MODIFY**: Use `.cli-ai-chat/sessions.json`
- `commands/start-plan.toml` - **MODIFY**: Use `.cli-ai-chat/sessions.json`
- `commands/list-sessions.toml` - **MODIFY**: Use `.cli-ai-chat/sessions.json`
- `commands/switch-session.toml` - **MODIFY**: Use `.cli-ai-chat/sessions.json`
- `commands/save-artifact.toml` - **MODIFY**: Use `.cli-ai-chat/sessions.json`

### Codex Platform (NEW - Create from scratch)
Create in `template/.codex/commands/`:
- `new-session.yaml` - Use `.cli-ai-chat/sessions.json` and add platform="codex" field
- `checkpoint.yaml` - Use `.cli-ai-chat/sessions.json`
- `continue-session.yaml` - Use `.cli-ai-chat/sessions.json`
- `end-session.yaml` - Use `.cli-ai-chat/sessions.json`
- `start-plan.yaml` - Use `.cli-ai-chat/sessions.json`
- `list-sessions.yaml` - Use `.cli-ai-chat/sessions.json`
- `switch-session.yaml` - Use `.cli-ai-chat/sessions.json`
- `save-artifact.yaml` - Use `.cli-ai-chat/sessions.json`

### Session Templates (shared, from existing system)
Copy from `F:/Work/Projects/AI Chats/claude_cli_chat/_templates/session/`:
- `context-template.md`
- `messages-template.md`
- `decisions-template.md`

### Documentation Files (EXACT copies from existing systems)
- `CLAUDE.md` - **EXACT COPY** from existing Claude system, then **MODIFY**: Update registry path from `.claude/` to `.cli-ai-chat/`
- `GEMINI.md` - **EXACT COPY** from existing Gemini system
- `AGENTS.md` - **EXACT COPY** adapted from Gemini (for Codex/ChatGPT)
- `SYSTEM.md` - Combined master documentation
- `README.md` - User-facing documentation
- `docs/PLATFORM_COMMAND_FORMATS.md` - Command format reference
- `docs/USAGE_GUIDE.md` - Comprehensive usage guide

## Critical Reference Files

These files provide the patterns and templates for implementation:

### Claude CLI Chat System (Primary Template)
- `F:/Work/Projects/AI Chats/claude_cli_chat/.claude/commands/new-session.md` - Command format with bash script patterns and jq operations
- `F:/Work/Projects/AI Chats/claude_cli_chat/SYSTEM.md` - Complete system documentation
- `F:/Work/Projects/AI Chats/claude_cli_chat/.claude/commands/checkpoint.md` - AI-generated content validation pattern
- `F:/Work/Projects/AI Chats/claude_cli_chat/CLAUDE.md` - Claude-specific guidance

### Gemini CLI Chat System
- `F:/Work/Projects/AI Chats/gemini_cli_chat/.gemini/commands/new-session.toml` - TOML command format reference
- `F:/Work/Projects/AI Chats/gemini_cli_chat/GEMINI.md` - Gemini-specific guidance
- `F:/Work/Projects/AI Chats/gemini_cli_chat/SYSTEM.md` - Complete system documentation

### AppSheet Project (CLI Structure Reference)
- `F:/Work/Projects/npm/Packages/appsheet-project/package/bin/appsheet-project.js` - CLI entry point pattern
- `F:/Work/Projects/npm/Packages/appsheet-project/package/package.json` - Package configuration pattern

### Session Templates
- `F:/Work/Projects/AI Chats/claude_cli_chat/_templates/session/context-template.md` - Template format
- `F:/Work/Projects/AI Chats/claude_cli_chat/_templates/session/messages-template.md` - Template format
- `F:/Work/Projects/AI Chats/claude_cli_chat/_templates/session/decisions-template.md` - Template format

## Implementation Phases

### Phase 1: Package Structure Setup
1. Create `package.json` with appropriate configuration
2. Create `.npmignore` file
3. Create directory structure for CLI tool and templates

### Phase 2: CLI Tool Implementation
1. Create `bin/cli-ai-chat-system.js` with init, update, help, platform commands
2. Follow the appsheet-project pattern for CLI implementation
3. Add color-coded output and user confirmation prompts
4. Implement platform-specific installation logic:
   - `init [platform]` - If no argument, install all; if argument, install only specified
   - `update [platform]` - If no argument, update all installed; if argument, update only specified
   - Validate platform argument (must be: claude, gemini, codex)
5. Implement conditional file copying based on platform selection

### Phase 3: Platform Configuration
1. Copy Claude commands (5 markdown files) - **MODIFY** all to use `.cli-ai-chat/sessions.json` and add platform="claude" field
2. Copy Gemini commands (8 TOML files) - **MODIFY** all to use `.cli-ai-chat/sessions.json` and add platform="gemini" field
3. Create Codex commands (8 YAML files) - adapt from Gemini patterns, use `.cli-ai-chat/sessions.json` and add platform="codex" field

### Phase 4: Session Templates
1. Copy shared session templates from Claude system
2. Verify placeholder syntax for template substitution

### Phase 5: Documentation
1. Copy `CLAUDE.md` from existing Claude system - **MODIFY**: Update registry path references
2. Copy `GEMINI.md` from existing Gemini system
3. Create `AGENTS.md` adapted from Gemini system (for Codex/ChatGPT)
4. Create `SYSTEM.md` (combined master documentation)
5. Create `README.md` (user-facing)
6. Create `docs/PLATFORM_COMMAND_FORMATS.md`
7. Create `docs/USAGE_GUIDE.md`

### Phase 6: Testing & Validation
1. Test init command (no argument - all platforms)
2. Test init command with platform argument (claude, gemini, codex)
3. Test update command (no argument and with platform argument)
4. Verify all platform commands work
5. Test cross-platform session scenarios
6. Test documentation template generation for each platform

## Coding Standards

- Use tab characters for indentation (not spaces)
- Tab width displays as 4 spaces
- Apply to all code files

## Verification

After implementation, verify:

1. **CLI Tool Works**:
   ```bash
   cd cli-ai-chat-system
   npx cli-ai-chat-system init                    # Install all platforms
   npx cli-ai-chat-system init claude            # Install Claude only
   npx cli-ai-chat-system init gemini           # Install Gemini only
   npx cli-ai-chat-system init codex            # Install Codex only
   npx cli-ai-chat-system help
   npx cli-ai-chat-system platform
   ```

2. **Selective Platform Installation**:
   ```bash
   # Test Claude-only installation
   mkdir test-claude && cd test-claude
   npx cli-ai-chat-system init claude
   verify: `.claude/` exists, `.gemini/` and `.codex/` do NOT exist
   verify: `CLAUDE.md` exists, `GEMINI.md` and `AGENTS.md` do NOT exist
   cd .. && rm -rf test-claude

   # Test Gemini-only installation
   mkdir test-gemini && cd test-gemini
   npx cli-ai-chat-system init gemini
   verify: `.gemini/` exists, `.claude/` and `.codex/` do NOT exist
   verify: `GEMINI.md` exists, `CLAUDE.md` and `AGENTS.md` do NOT exist
   cd .. && rm -rf test-gemini

   # Test Codex-only installation
   mkdir test-codex && cd test-codex
   npx cli-ai-chat-system init codex
   verify: `.codex/` exists, `.claude/` and `.gemini/` do NOT exist
   verify: `AGENTS.md` exists, `CLAUDE.md` and `GEMINI.md` do NOT exist
   cd .. && rm -rf test-codex

   # Test all platforms installation
   mkdir test-all && cd test-all
   npx cli-ai-chat-system init
   verify: `.claude/`, `.gemini/`, `.codex/` all exist
   verify: `CLAUDE.md`, `GEMINI.md`, `AGENTS.md` all exist
   cd .. && rm -rf test-all
   ```

3. **All Files Created (full installation)**:
   - Verify `.cli-ai-chat/` exists with `sessions.json` and `active-session.txt`
   - Verify `.claude/`, `.gemini/`, `.codex/` directories exist with commands only
   - Verify all command files present
   - Verify session templates exist
   - Verify `CLAUDE.md`, `GEMINI.md`, and `AGENTS.md` were copied with updated registry references
   - Verify other documentation files exist

3. **Session Structure**:
   - Create a new session with `/new-session test`
   - Verify all 8 folders created (artifacts, core_files, core_instructions, uploaded_files, planning_mode with archive)
   - Verify 3 session files created (context.md, messages.md, decisions.md)

4. **Cross-Platform Commands**:
   - Verify Claude commands work (markdown format)
   - Verify Gemini commands work (TOML format)
   - Verify Codex commands work (YAML format)

5. **Documentation Files**:
   - After running `npx cli-ai-chat-system init`
   - Verify `CLAUDE.md` contains `.cli-ai-chat/` registry references (updated from `.claude/`)
   - Verify `GEMINI.md` contains `.cli-ai-chat/` registry references
   - Verify `AGENTS.md` contains `.cli-ai-chat/` registry references

6. **Unified Registry**:
   - Create session with Claude `/new-session test-project test-topic`
   - Verify `.cli-ai-chat/sessions.json` has entry with `platform: "claude"`
   - Switch to Gemini terminal and continue session `/continue-session test-topic`
   - Verify same session is resumed
   - Verify `lastActive` timestamp updated
   - Verify only one active session in `active-session.txt`

7. **Update Command**:
   - Modify a template file
   - Run `npx cli-ai-chat-system update`
   - Verify template is updated, user data preserved
   - Verify `.cli-ai-chat/sessions.json` is NOT overwritten during update
