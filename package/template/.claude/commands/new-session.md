---
description: Create a new AI chat session with organized folder structure
---

Create a new session folder for organizing this AI chat conversation using efficient bash commands.

**Arguments:** {{{ARGS}}}

Please execute the following:

## Step 0: Validate Prerequisites

Before proceeding, verify that all required tools and templates are available.

Use the Bash tool to run:
```bash
# Check jq is installed
if ! command -v jq &> /dev/null; then
  echo "ERROR: jq is not installed"
  echo "Install with: choco install jq (Windows) or apt install jq (Linux)"
  exit 1
fi

# Check templates exist
if [ ! -f "_templates/session/context-template.md" ] || \
   [ ! -f "_templates/session/messages-template.md" ] || \
   [ ! -f "_templates/session/decisions-template.md" ]; then
  echo "ERROR: Template files missing in _templates/session/"
  echo "Required: context-template.md, messages-template.md, decisions-template.md"
  exit 1
fi

echo "Prerequisites OK"
```

If validation fails, stop and display the error message.

## Step 1: Parse Arguments

Parse the `{{{ARGS}}}` parameter:

- **If 2+ words provided:** First word = project name, rest = session topic
- **If 1 word provided:** Use AskUserQuestion to ask: "Is this a project name or session topic?"
  - If project: Ask for session topic
  - If topic: This goes to unnamed_projects
- **If no args:** Ask for both project (optional) and session topic

**Validation:**
- Project name (if provided) must be kebab-case: `^[a-z0-9]+(-[a-z0-9]+)*$`
- Session topic must be kebab-case: `^[a-z0-9]+(-[a-z0-9]+)*$`

**Examples:**
- ✅ Valid: "seo-research", "bug-fix-123", "testing"
- ❌ Invalid: "SEO Research", "seoResearch", "seo_research"

If validation fails, display error:
```
Error: Names must use kebab-case (lowercase, hyphens, numbers only).

Examples:
  ✅ Valid: "seo-research", "bug-fix-123", "testing"
  ❌ Invalid: "SEO Research", "seoResearch", "seo_research"

Please provide names in kebab-case format.
```

## Step 2: Check Session Doesn't Already Exist

Determine the session path and check if it already exists.

**Path format:**
- If project provided: `chats/projects/[project-name]/YYYY-MM-DD-[session-topic]`
- If no project: `chats/unnamed_projects/YYYY-MM-DD-[session-topic]`

Use Bash tool to check:
```bash
SESSION_PATH="chats/projects/[project-name]/[YYYY-MM-DD]-[topic]"
[ -d "$SESSION_PATH" ] && echo "EXISTS" || echo "NOT_EXISTS"
```

If EXISTS, display error:
```
Error: Session already exists at [path]

A session with this topic already exists for today.
Please either:
  - Choose a different topic name
  - Continue the existing session with /continue-session
```

## Step 3: Create Complete Session Structure

Execute a **single bash script** that creates all folders, files, and updates the registry.

Build the following bash script with actual values substituted:

**Variables to substitute:**
- `[project-name]` - kebab-case project name (or empty string if unnamed)
- `[project-display]` - kebab-case project name (or "unnamed" if no project)
- `[session-topic]` - kebab-case topic name
- `[YYYY-MM-DD]` - Current date in YYYY-MM-DD format
- `[ISO-8601-timestamp]` - Current datetime (use JavaScript: `new Date().toISOString()`)

**Bash Script Template:**
```bash
#!/bin/bash

# Session variables
PROJECT_NAME="[project-name]"  # Empty string if unnamed
PROJECT_DISPLAY="[project-display]"  # "unnamed" if no project
SESSION_TOPIC="[session-topic]"
CURRENT_DATE="[YYYY-MM-DD]"
CURRENT_DATETIME="[ISO-8601-timestamp]"

# Determine session path
if [ -n "$PROJECT_NAME" ]; then
  SESSION_DIR="chats/projects/$PROJECT_NAME/$CURRENT_DATE-$SESSION_TOPIC"
  SESSION_PATH="chats/projects/$PROJECT_NAME/$CURRENT_DATE-$SESSION_TOPIC"
else
  SESSION_DIR="chats/unnamed_projects/$CURRENT_DATE-$SESSION_TOPIC"
  SESSION_PATH="chats/unnamed_projects/$CURRENT_DATE-$SESSION_TOPIC"
fi

TEMPLATE_DIR="_templates/session"
REGISTRY_FILE=".cli-ai-chat/sessions.json"
ACTIVE_FILE=".cli-ai-chat/active-session.txt"

echo "Creating session structure..."

# 1. Create all directories in a single command using brace expansion
mkdir -p "$SESSION_DIR"/{artifacts,core-files,core-instructions,uploaded-files,planning-mode/archive}

# 2. Copy and replace placeholders in template files
copy_and_replace() {
  local src="$1"
  local dest="$2"

  cp "$src" "$dest"
  sed -i "s/\\[SESSION_TOPIC\\]/$SESSION_TOPIC/g" "$dest"
  sed -i "s/\\[PROJECT_NAME\\]/$PROJECT_DISPLAY/g" "$dest"
  sed -i "s/\\[CURRENT_DATETIME\\]/$CURRENT_DATETIME/g" "$dest"
  sed -i "s/\\[DATETIME\\]/$CURRENT_DATETIME/g" "$dest"
}

copy_and_replace "$TEMPLATE_DIR/context-template.md" "$SESSION_DIR/context.md"
copy_and_replace "$TEMPLATE_DIR/messages-template.md" "$SESSION_DIR/messages.md"
copy_and_replace "$TEMPLATE_DIR/decisions-template.md" "$SESSION_DIR/decisions.md"

echo "Session files created: $SESSION_DIR"

# 3. Handle session registry with jq
echo "Updating session registry..."

# Create .cli-ai-chat directory if needed
mkdir -p .cli-ai-chat

# Initialize registry if it doesn't exist
if [ ! -f "$REGISTRY_FILE" ]; then
  echo '{"sessions": []}' > "$REGISTRY_FILE"
fi

# Read current active session path (if exists)
PREV_ACTIVE=""
if [ -f "$ACTIVE_FILE" ]; then
  PREV_ACTIVE=$(cat "$ACTIVE_FILE")
fi

# If there was a previous active session, mark it as paused
if [ -n "$PREV_ACTIVE" ]; then
  jq --arg path "$PREV_ACTIVE" --arg time "$CURRENT_DATETIME" \
    '.sessions |= map(if .path == $path then .status = "paused" | .lastActive = $time else . end)' \
    "$REGISTRY_FILE" > "$REGISTRY_FILE.tmp" && mv "$REGISTRY_FILE.tmp" "$REGISTRY_FILE"
  echo "Previous session paused: $PREV_ACTIVE"
fi

# Add new session to registry (with platform field)
jq --arg path "$SESSION_PATH" \
   --arg topic "$SESSION_TOPIC" \
   --arg project "$PROJECT_DISPLAY" \
   --arg created "$CURRENT_DATETIME" \
   '.sessions += [{
     "path": $path,
     "topic": $topic,
     "project": $project,
     "status": "in-progress",
     "platform": "claude",
     "created": $created,
     "lastActive": $created
   }]' \
   "$REGISTRY_FILE" > "$REGISTRY_FILE.tmp" && mv "$REGISTRY_FILE.tmp" "$REGISTRY_FILE"

# Update active session pointer
echo "$SESSION_PATH" > "$ACTIVE_FILE"

echo "✓ Session created and activated: $SESSION_PATH"
echo "✓ Registry updated"
if [ -n "$PREV_ACTIVE" ]; then
  echo "⚠ Previous session paused: $PREV_ACTIVE"
fi
```

**Execute this script in ONE Bash tool call** with all variables substituted.

## Step 4: Confirm Success

Display success message:
```
✓ Session created successfully!

Location: [session-path]
Project: [project-name or "Unnamed"]
Status: Active

[If previous session was paused:]
⚠ Previous session paused: [previous-topic]

You can now:
  - Use /checkpoint to save progress
  - Use /start-plan for complex multi-phase work
  - Use /end-session when complete
```

**Usage Examples:**
- `/new-session spanshades seo-research` → Creates in projects/spanshades/
- `/new-session debugging` → Creates in unnamed_projects/
- `/new-session` → Prompts for details interactively

---

**Token Efficiency:** This command uses ~90% fewer tokens than traditional Read/Write approach by executing all operations in a single bash script with jq for JSON handling.
