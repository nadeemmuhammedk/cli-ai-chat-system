# Platform Command Format Reference

## Overview

All three platforms use the same 5 session management commands, each written in the native format of that platform's CLI tool.

## Claude — Markdown (`.md`)

**Location:** `.claude/commands/`

**Format:**
```markdown
---
description: Short description of the command
---

Full prompt text with instructions for Claude.

**Arguments:** {{{ARGS}}}

Steps:
1. Step one
2. Step two
```

**Key characteristics:**
- Detailed multi-step instructions with bash script blocks
- Uses `{{{ARGS}}}` for command arguments
- Supports full markdown formatting
- Bash scripts use `jq` for JSON operations

**Example usage in Claude CLI:**
```
/new-session my-project feature-x
/checkpoint
/end-session
```

---

## Gemini — TOML (`.toml`)

**Location:** `.gemini/commands/`

**Format:**
```toml
description = "Short description of the command"

prompt = """
Full prompt text with instructions for Gemini.

**Arguments:** {{args}}

Steps:
1. Step one
2. Step two
"""
```

**Key characteristics:**
- Uses `{{args}}` for command arguments (double braces)
- Prompt content in a TOML multi-line string
- Numbered selection lists for user choices
- Same bash/jq patterns as Claude commands

**Example usage in Gemini CLI:**
```
/new-session my-project feature-x
/checkpoint
/end-session
```

---

## Codex — YAML (`.yaml`)

**Location:** `.codex/commands/`

**Format:**
```yaml
description: Short description of the command

prompt: |
  Full prompt text with instructions for Codex.

  **Arguments:** $ARGS

  Steps:
  1. Step one
  2. Step two
```

**Key characteristics:**
- Uses `$ARGS` for command arguments
- Prompt content as a YAML literal block scalar (`|`)
- Numbered selection lists for user choices
- Same bash/jq patterns as Claude and Gemini commands

**Example usage in Codex CLI:**
```
/new-session my-project feature-x
/checkpoint
/end-session
```

---

## Comparison Table

| Feature | Claude | Gemini | Codex |
|---------|--------|--------|-------|
| File format | `.md` | `.toml` | `.yaml` |
| Location | `.claude/commands/` | `.gemini/commands/` | `.codex/commands/` |
| Args syntax | `{{{ARGS}}}` | `{{args}}` | `$ARGS` |
| Prompt wrapper | Markdown body | `prompt = """..."""` | `prompt: |` |
| AI guidance file | `CLAUDE.md` | `GEMINI.md` | `AGENTS.md` |

## Shared Registry

All platforms read and write to the same session registry:

```
.cli-ai-chat/sessions.json       ← all sessions
.cli-ai-chat/active-session.txt  ← currently active session
```

This is what enables cross-platform session continuity.
