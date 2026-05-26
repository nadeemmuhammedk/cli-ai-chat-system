---
description: Finalize and close the current session
---

End the active session and finalize all documentation.

Please execute the following:

1. **Read active session pointer:**
   - Read `.cli-ai-chat/active-session.txt` to get the current session path
   - If file doesn't exist, inform the user there's no active session to end

2. **Check for planning mode files:**
   - Look in `[session-path]/planning-mode/` for active plan/todo/done files
   - If found, planning mode was used during this session

3. **Perform final checkpoint with AI-generated content:**

   a. **Analyze full session** from start to current:
      - Review entire conversation history
      - Identify all major work completed
      - Note all artifacts created
      - Collect decisions made throughout session
      - Track session evolution and outcomes

   b. **Generate comprehensive session summary:**
      - Draft final summary covering all work
      - Draft any remaining decisions since last checkpoint

   c. **Present for validation** using AskUserQuestion:
      - Question: "Confirm final session content (select all that are accurate):"
      - Header: "Session End"
      - Options (dynamically generated):
        - "[Generated full session summary]"
        - "[Generated decision 1]" (if any since last checkpoint)
        - "[Generated decision 2]" (if multiple decisions)
        - "Add/modify content"
      - multiSelect: true

   d. **Handle modifications** (if "Add/modify content" selected):
      - Follow same pattern as checkpoint command
      - Use AskUserQuestion with modification options
      - Incorporate user corrections

4. **If planning mode was used, analyze planning cycle:**
   - Count tasks using grep (no need to read full files)
   - Calculate completion percentage
   - Display planning summary

5. **Get session status** using AskUserQuestion:
   - Question: "What is the final status of this session?"
   - Header: "Status"
   - Options:
     - "Completed" - All work finished successfully
     - "Paused" - Work incomplete but may resume later
     - "Abandoned" - Work discontinued, will not continue
   - multiSelect: false

6. **Update context.md content using Edit tool BEFORE running bash script:**

   **CRITICAL**: This step must be completed BEFORE step 7 (bash script execution).

   a. **Read current context.md** to see existing "Current Focus" and "Key Points" sections

   b. **Using the validated session summary from step 3**, generate:
      - New "Current Focus" text: one sentence describing what the session produced
      - New "Key Points" bullet list covering:
        - Work completed and artifacts created
        - Key design or technical decisions made
        - Tools, brands, or external resources used
        - Any important constraints or scope notes

   c. **Use Edit tool** to replace the placeholder/outdated sections:
      - Use the ACTUAL resolved file path from `active-session.txt`
      - **CRITICAL:** Do NOT pass `$CONTEXT_FILE` or any shell variable as the file path
      - Replace entire "## Current Focus" paragraph with new content
      - Replace entire "## Key Points" bullet list with new content
      - Do NOT update timestamp or status yet (bash script handles those)
      - Verify edit was successful before proceeding

7. **Finalize session with bash script:**

After user validates all content, selects final status, and context.md content is updated, execute the following bash script:

```bash
#!/bin/bash

# Variables from validated AI content and user selections
SESSION_PATH="[session-path-from-step-1]"
CURRENT_DATETIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)
FINAL_STATUS="[completed|paused|abandoned]"  # From user selection
FINAL_SUMMARY="[validated-summary-from-user]"
DECISIONS_TO_ADD="[validated-decisions-if-any]"

# File paths
ACTIVE_FILE=".cli-ai-chat/active-session.txt"
REGISTRY_FILE=".cli-ai-chat/sessions.json"
MESSAGES_FILE="$SESSION_PATH/messages.md"
DECISIONS_FILE="$SESSION_PATH/decisions.md"
CONTEXT_FILE="$SESSION_PATH/context.md"

# 1. Count planning tasks BEFORE updating files (if planning mode was used)
TODO_COUNT=0
DONE_COUNT=0
PLAN_NAME=""
PLANNING_DIR="$SESSION_PATH/planning-mode"
if ls "$PLANNING_DIR"/*-plan.md 2>/dev/null | grep -q .; then
  PLAN_FILE=$(ls "$PLANNING_DIR"/*-plan.md 2>/dev/null | head -1)
  if [ -n "$PLAN_FILE" ]; then
    PLAN_NAME=$(basename "$PLAN_FILE" | sed 's/.*-\(.*\)-plan.md/\1/')
    TODO_FILE=$(ls "$PLANNING_DIR"/*-todo.md 2>/dev/null | head -1)
    DONE_FILE=$(ls "$PLANNING_DIR"/*-done.md 2>/dev/null | head -1)

    # Count tasks using grep (no file reads needed)
    TODO_COUNT=$(grep -c "^[0-9]*\. \[ \]" "$TODO_FILE" 2>/dev/null || echo 0)
    DONE_COUNT=$(grep -c "^[0-9]*\. \[x\]" "$DONE_FILE" 2>/dev/null || echo 0)
    TOTAL=$((TODO_COUNT + DONE_COUNT))

    # Calculate percentage (safe division)
    if [ $TOTAL -gt 0 ]; then
      PERCENT=$((DONE_COUNT * 100 / TOTAL))
    else
      PERCENT=0
    fi

    echo ""
    echo "📋 Planning Cycle Summary:"
    echo "  Plan: $PLAN_NAME"
    echo "  Completion: $DONE_COUNT/$TOTAL tasks ($PERCENT%)"
  fi
fi

# 2. Append final exchange to messages.md
EXCHANGE_COUNT=$(grep -c "^### Exchange" "$MESSAGES_FILE" 2>/dev/null || echo 0)
NEXT_EXCHANGE_NUMBER=$((EXCHANGE_COUNT + 1))
cat >> "$MESSAGES_FILE" <<MESSAGES_EOF

### Exchange $NEXT_EXCHANGE_NUMBER
**User:** Ending session
**Assistant:** $FINAL_SUMMARY
**Outcome:** Session finalized with status: $FINAL_STATUS
MESSAGES_EOF

# 3. Append final decisions to decisions.md (if any)
if [ -n "$DECISIONS_TO_ADD" ]; then
  cat >> "$DECISIONS_FILE" <<DECISIONS_EOF

### Final Session Status ($CURRENT_DATETIME)
$DECISIONS_TO_ADD
DECISIONS_EOF
fi

# 4. Update context.md status value using sed (no prior read)
# Replace the status value line (the line immediately after "## Status" header)
sed -i "/^## Status/{n; s/.*/$FINAL_STATUS/;}" "$CONTEXT_FILE"

# 5. If planning mode was used, append planning summary to context.md
if [ -n "$PLAN_NAME" ]; then
  cat >> "$CONTEXT_FILE" <<PLANNING_EOF

## Planning Summary
Plan: $PLAN_NAME
Completion: $DONE_COUNT/$TOTAL tasks ($PERCENT%)
Status: $FINAL_STATUS
PLANNING_EOF
fi

# 6. Update context.md timestamp
sed -i "s/\\*Last Updated:.*/\\*Last Updated: $CURRENT_DATETIME*/" "$CONTEXT_FILE"

# 7. Update session registry with jq (atomic operation, no prior read)
jq --arg path "$SESSION_PATH" \
   --arg status "$FINAL_STATUS" \
   --arg time "$CURRENT_DATETIME" \
   '.sessions |= map(if .path == $path then
     .status = $status |
     .lastActive = $time
   else . end)' \
   "$REGISTRY_FILE" > "$REGISTRY_FILE.tmp" && mv "$REGISTRY_FILE.tmp" "$REGISTRY_FILE"

# 8. Clear active session pointer
rm -f "$ACTIVE_FILE"

# 9. Display comprehensive session summary
echo ""
echo "✓ Session finalized: $SESSION_PATH"
echo "✓ Status: $FINAL_STATUS"
echo "✓ Updated: context.md, messages.md, decisions.md, sessions.json"
echo "✓ Active session pointer cleared"

# Extract session metadata for display
SESSION_TOPIC=$(basename "$SESSION_PATH" | sed 's/^[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}-//')
PROJECT_NAME=$(jq -r --arg path "$SESSION_PATH" '.sessions[] | select(.path == $path) | .project' "$REGISTRY_FILE")
CREATED_DATE=$(jq -r --arg path "$SESSION_PATH" '.sessions[] | select(.path == $path) | .created' "$REGISTRY_FILE")

echo ""
echo "Session Summary:"
echo "  Project: $PROJECT_NAME"
echo "  Topic: $SESSION_TOPIC"
echo "  Created: $CREATED_DATE"
echo "  Finalized: $CURRENT_DATETIME"
echo "  Status: $FINAL_STATUS"

if [ -n "$PLAN_NAME" ]; then
  echo ""
  echo "Planning Mode:"
  echo "  Plan: $PLAN_NAME"
  echo "  Tasks Completed: $DONE_COUNT"
  echo "  Tasks Remaining: $TODO_COUNT"
  echo "  Completion: $PERCENT%"
fi

echo ""
echo "The session folder is now complete and can be referenced later."
```

**Before running the bash script:**
- Confirm context.md "Current Focus" and "Key Points" were updated in step 6
- Append validated final summary to messages.md
- Format any remaining decisions as proper markdown
- Get user's final status selection (completed/paused/abandoned)

**If planning mode was used:**
- **If incomplete tasks exist**, use AskUserQuestion:
  - Question: "How should incomplete tasks be handled?"
  - Header: "Tasks"
  - Options:
    - "Abandoned" - Tasks discontinued
    - "Carry Over" - Continue in next session
    - "No Longer Relevant" - Tasks became unnecessary
  - multiSelect: false

- **If "Abandoned" selected**, ask follow-up:
  - Prompt: "Please explain why these tasks were abandoned (will be documented in plan.md)"
  - Update plan.md with explanation using sed or append

**Key Optimizations:**
- ✅ Initial Reads stay (required for AI analysis of full session)
- ✅ Never reads files TWICE (once for AI, once for updates)
- ✅ Uses `grep -c` for task counting (no file reads)
- ✅ Uses `sed -i` for status updates (pattern matching, no read)
- ✅ Uses `cat >>` for appending (no prior read)
- ✅ Uses `jq` for registry update (atomic, no read)
- ✅ ~80% token reduction by eliminating second reads and all Write tools

The session folder is now complete and can be referenced later.
