---
description: Resume work on an existing session
---

Continue working on a previous session. Displays available sessions and allows switching by number.

**Arguments:** {{{ARGS}}} (optional - session number)

Please execute the following:

1. **Read session registry:**
   - Read `.cli-ai-chat/sessions.json` using the Read tool
   - Filter to only show sessions with status "paused" or "in-progress"
   - If no registry exists, inform user to run `/new-session` first

2. **If no arguments provided ({{{ARGS}}} is empty), display available sessions:**
   - Group sessions by project name
   - Number them sequentially across all projects (1, 2, 3, 4... not restarting per project)
   - Show session date-topic folder name and status
   - Format:
   ```
   📋 Available Sessions (paused/in-progress only):

   Projects:

   session-management-system:
     [1] 2025-01-16-initial-implementation [paused]
     [2] 2025-01-20-feature-additions [paused]

   onpage-seo-tools:
     [3] 2025-01-15-meta-generator [paused]

   Unnamed Projects:
     [4] 2025-01-17-quick-debugging [paused]

   Total sessions: 4
   ```
   - Ask user to respond with a session number
   - Wait for user's next message with the number

3. **If arguments provided (user selected a number):**
   - Match the number to the session from the filtered list (1-indexed)
   - Validate that the session directory exists
   - Extract the session path for use in bash commands

4. **Update session registry and active pointer using bash+jq:**
   Execute this bash script with the selected session path:
   ```bash
   REGISTRY_FILE=".cli-ai-chat/sessions.json"
   ACTIVE_FILE=".cli-ai-chat/active-session.txt"
   TARGET_SESSION="[selected-session-path]"
   CURRENT_DATETIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)

   # Mark previous active session as paused (if exists)
   PREV_ACTIVE=$(cat "$ACTIVE_FILE" 2>/dev/null)
   if [ -n "$PREV_ACTIVE" ] && [ "$PREV_ACTIVE" != "$TARGET_SESSION" ]; then
     jq --arg path "$PREV_ACTIVE" --arg time "$CURRENT_DATETIME" \
       '.sessions |= map(if .path == $path then .status = "paused" | .lastActive = $time else . end)' \
       "$REGISTRY_FILE" > "$REGISTRY_FILE.tmp" && mv "$REGISTRY_FILE.tmp" "$REGISTRY_FILE"
     echo "⚠ Previous session paused: $(basename "$PREV_ACTIVE")"
     echo ""
   fi

   # Mark target session as in-progress
   jq --arg path "$TARGET_SESSION" --arg time "$CURRENT_DATETIME" \
     '.sessions |= map(if .path == $path then .status = "in-progress" | .lastActive = $time else . end)' \
     "$REGISTRY_FILE" > "$REGISTRY_FILE.tmp" && mv "$REGISTRY_FILE.tmp" "$REGISTRY_FILE"

   # Update active session pointer
   echo "$TARGET_SESSION" > "$ACTIVE_FILE"
   ```

5. **Display session context:**
   - Read the complete `[session-path]/context.md` file using the Read tool
   - Show the full context to give user complete orientation
   - Display under a "Context:" heading

6. **Check for active planning mode:**
   - Look in `[session-path]/planning_mode/` for `*-plan.md` files using Glob
   - If planning files exist, use bash to count tasks:
   ```bash
   PLANNING_DIR="[session-path]/planning_mode"
   PLAN_FILE=$(ls "$PLANNING_DIR"/*-plan.md 2>/dev/null | head -1)
   PLAN_NAME=$(basename "$PLAN_FILE" | sed 's/^[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}-//' | sed 's/-plan\.md$//')
   TODO_FILE=$(ls "$PLANNING_DIR"/*-todo.md 2>/dev/null | head -1)
   DONE_FILE=$(ls "$PLANNING_DIR"/*-done.md 2>/dev/null | head -1)
   TODO_COUNT=$(grep -c "^[0-9]*\. \[ \]" "$TODO_FILE" 2>/dev/null || echo 0)
   DONE_COUNT=$(grep -c "^[0-9]*\. \[x\]" "$DONE_FILE" 2>/dev/null || echo 0)
   echo "$PLAN_NAME|$TODO_COUNT|$DONE_COUNT"
   ```
   - Display planning cycle info:
   ```
   📋 Active Planning Cycle:
     Plan: [plan-name]
     Completed: X tasks
     Remaining: Y tasks

     I will automatically reference the plan and update tasks as we work.
   ```

7. **Confirm session loaded:**
   ```
   ✓ Resumed: [session-topic]
     Path: [full-session-path]
     Status: in-progress
     Project: [project-name]
     Created: [creation-date]
     Planning Mode: [Active: name] or [Inactive]

   Now you can use /checkpoint, /start-plan, or /end-session as normal.
   ```

**Key Design:**
- ✅ AI reads and displays sessions (clean numbered list 1-N, proper grouping)
- ✅ Bash+jq handles atomic registry updates (safe, efficient)
- ✅ Bash counts planning tasks (no need for AI to read full files)
- ✅ AI reads full context.md for complete session context
- ✅ Simple number selection (user types "3", AI matches to session #3)
- ✅ No viewport issues - clean list fits in terminal
