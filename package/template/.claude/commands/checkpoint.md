---
description: Save a checkpoint of the current session's progress
---

Create a checkpoint for the active session.

Please execute the following:

1. **Read active session pointer:**
   - Read `.cli-ai-chat/active-session.txt` to get the current session path
   - If file doesn't exist, inform the user to create a session with `/new-session` first

2. **Check for planning mode files:**
   - Look in `[session-path]/planning-mode/` for active plan/todo/done files
   - If found, planning mode is active

3. **Analyze conversation and generate checkpoint content:**

   a. **Review conversation history** since last checkpoint (or session start if first checkpoint):
      - Identify key topics discussed
      - Note work completed and artifacts created
      - Detect decision points (questions asked/answered, approaches chosen)
      - Observe context evolution (scope changes, new capabilities added)

   b. **Generate draft content** based on analysis:
      - **Summary**: Concise description of work done (e.g., "Generated shade construction webpage, corrected LSI keyword integration methodology")
      - **Decisions**: Any choices made with rationale (e.g., "Chose full regeneration over patching to ensure natural keyword integration")
      - **Context changes**: New capabilities or scope shifts (e.g., "Added methodology error detection capability")

   c. **Present generated content for validation** using AskUserQuestion:
      - Question: "Confirm checkpoint content (select all that are accurate):"
      - Header: "Checkpoint"
      - Options (dynamically generated based on what was detected):
        - "[Generated summary text]" (keep under 100 characters)
        - "[Generated decision 1]" (if decision detected)
        - "[Generated decision 2]" (if additional decisions detected)
        - "[Generated context change]" (if context evolution detected)
        - "Add/modify content" (allows user corrections/additions)
      - multiSelect: true

   d. **Handle user modifications** (if "Add/modify content" was selected):
      - Use follow-up AskUserQuestion:
        - Question: "What would you like to add or change?"
        - Header: "Modifications"
        - Options:
          - "Modify summary" → Prompt: "Please provide corrected summary"
          - "Add decision" → Prompt: "Describe decision: context, options, choice, rationale"
          - "Modify context" → Prompt: "Describe context changes"
          - "Add missing item" → Prompt: "What else should be included?"
        - multiSelect: true
      - For each selected option, ask appropriate follow-up narrative prompt
      - Incorporate user corrections into the checkpoint content

4. **If planning mode is active:**

   a. **Review planning files:**
      - Read current plan.md, todo.md, and done.md
      - Compare documented plan with actual work performed

   b. **Present planning status check** using AskUserQuestion:
      - Question: "Select all that apply to your planning work:"
      - Header: "Planning Status"
      - Options:
        - "Work deviated from plan" - Approach changed from plan.md
        - "Plan needs updating" - Update plan.md with new direction
        - "Everything on track" - No deviations
      - multiSelect: true

   c. **Handle planning responses:**
      - If "Work deviated from plan" selected:
        - Document deviation in decisions.md with explanation
      - If "Plan needs updating" selected:
        - Update plan.md to reflect new approach
        - Add note about when/why plan changed
      - Ensure todo.md and done.md are in sync with actual progress

5. **If context changed, update context.md BEFORE running bash script:**

   **CRITICAL**: This step must be completed BEFORE step 6 (bash script execution).

   a. **Read current context.md** to see existing "Current Focus" and "Key Points" sections

   b. **Determine if context.md needs updating** — trigger the Edit tool if EITHER condition is true:
      - User validated a context change in step 3 (scope shift, new capability, etc.), OR
      - The "Current Focus" section still contains the placeholder text `[To be filled during conversation]` — this means it's the first checkpoint and the file was never initialized. **Always populate it**, even if no explicit context change was detected.

   c. **When updating**, generate content from the validated checkpoint summary:
      - Generate new "Current Focus" text based on validated checkpoint content
      - Generate new "Key Points" bullet list reflecting:
        - Work completed and artifacts created
        - Key technical decisions made
        - New capabilities or scope changes
        - Reference to artifacts with file sizes if applicable

   d. **Use Edit tool** to replace the outdated sections:
      - Use the ACTUAL resolved file path from `active-session.txt` (e.g., `chats/projects/my-project/2026-01-15-my-topic/context.md`)
      - **CRITICAL:** Do NOT pass `$CONTEXT_FILE` or any shell variable as the file path — the Edit tool does not evaluate shell syntax and will fail with "File does not exist"
      - Replace entire "## Current Focus" paragraph with new validated content
      - Replace entire "## Key Points" bullet list with new validated content
      - Do NOT update timestamp yet (bash script handles this)
      - Verify edit was successful before proceeding

   e. **If neither condition in step 5b applies** (context already populated, no new changes):
      - Skip Edit tool - bash script will only update timestamp

6. **Update session files with validated content using bash:**

After user validates checkpoint content, execute the following bash script:

```bash
#!/bin/bash

# Variables from validated AI content
SESSION_PATH=$(cat .cli-ai-chat/active-session.txt | tr -d '[:space:]')
CURRENT_DATETIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)
CHECKPOINT_NUMBER="[increment-from-messages.md-count]"
WORK_SUMMARY="[validated-summary-from-user]"
DECISIONS_TO_ADD="[validated-decisions-array]"

# File paths
MESSAGES_FILE="$SESSION_PATH/messages.md"
DECISIONS_FILE="$SESSION_PATH/decisions.md"
CONTEXT_FILE="$SESSION_PATH/context.md"

# 1. Append to messages.md (NEVER read first - just append)
cat >> "$MESSAGES_FILE" <<MESSAGES_EOF

### Exchange $CHECKPOINT_NUMBER
**User:** [User activities since last checkpoint]
**Assistant:** $WORK_SUMMARY
**Outcome:** [Outcome description - generated from context]
MESSAGES_EOF

# 2. Update messages.md checkpoint timestamp
sed -i "s/\\*Last Checkpoint:.*/\\*Last Checkpoint: $CURRENT_DATETIME*/" "$MESSAGES_FILE" 2>/dev/null || \
  echo "*Last Checkpoint: $CURRENT_DATETIME*" >> "$MESSAGES_FILE"

# 3. Append decisions to decisions.md (if any)
if [ -n "$DECISIONS_TO_ADD" ]; then
  # Extract current decision count
  DECISION_COUNT=$(grep -oP 'Decision Count: \K\d+' "$DECISIONS_FILE" 2>/dev/null || echo 0)

  # For each decision, append formatted entry
  # (AI will generate proper markdown format based on validated content)
  cat >> "$DECISIONS_FILE" <<DECISIONS_EOF

$DECISIONS_TO_ADD
DECISIONS_EOF

  # Update decision count
  NEW_COUNT=$((DECISION_COUNT + 1))
  sed -i "s/Decision Count: [0-9]*/Decision Count: $NEW_COUNT/" "$DECISIONS_FILE" 2>/dev/null
fi

# Update decisions.md timestamp
sed -i "s/\\*Decision Count:.*/\\*Decision Count: ${NEW_COUNT:-$DECISION_COUNT} | Last Updated: $CURRENT_DATETIME*/" "$DECISIONS_FILE" 2>/dev/null

# 4. Update context.md timestamp
# NOTE: Content updates already handled by Edit tool in step 5 (if context changed)
# This only updates the timestamp
sed -i "s/\\*Last Updated:.*/\\*Last Updated: $CURRENT_DATETIME*/" "$CONTEXT_FILE"

# 5. Update session registry lastActive timestamp
REGISTRY_FILE=".cli-ai-chat/sessions.json"
jq --arg path "$SESSION_PATH" --arg time "$CURRENT_DATETIME" \
  '.sessions |= map(if .path == $path then .lastActive = $time else . end)' \
  "$REGISTRY_FILE" > "$REGISTRY_FILE.tmp" && mv "$REGISTRY_FILE.tmp" "$REGISTRY_FILE"

echo "✓ Checkpoint saved"
echo "✓ Updated: context.md, messages.md, decisions.md"
echo "✓ Timestamp: $CURRENT_DATETIME"

# 6. Check planning mode status (if active)
PLANNING_DIR="$SESSION_PATH/planning-mode"
if ls "$PLANNING_DIR"/*-plan.md 2>/dev/null | grep -q .; then
  # Planning mode is active
  TODO_FILE=$(ls "$PLANNING_DIR"/*-todo.md 2>/dev/null | head -1)
  DONE_FILE=$(ls "$PLANNING_DIR"/*-done.md 2>/dev/null | head -1)

  # Count pending and completed tasks using grep
  PENDING_COUNT=$(grep -c "^[0-9]*\. \[ \]" "$TODO_FILE" 2>/dev/null || echo 0)
  COMPLETED_COUNT=$(grep -c "^[0-9]*\. \[x\]" "$DONE_FILE" 2>/dev/null || echo 0)

  echo ""
  echo "Planning Mode Status:"
  echo "  Pending tasks: $PENDING_COUNT"
  echo "  Completed tasks: $COMPLETED_COUNT"

  # Update planning file timestamps
  if [ -f "$TODO_FILE" ]; then
    sed -i "s/\\*Last Updated:.*/\\*Last Updated: $CURRENT_DATETIME*/" "$TODO_FILE"
  fi
  if [ -f "$DONE_FILE" ]; then
    sed -i "s/\\*Last Updated:.*/\\*Last Updated: $CURRENT_DATETIME*/" "$DONE_FILE"
  fi

  # Update plan.md if user approved changes (determined in step 4c)
  PLAN_FILE=$(ls "$PLANNING_DIR"/*-plan.md 2>/dev/null | head -1)
  if [ -f "$PLAN_FILE" ] && [ "$PLAN_NEEDS_UPDATE" = "true" ]; then
    sed -i "s/\\*Last Updated:.*/\\*Last Updated: $CURRENT_DATETIME*/" "$PLAN_FILE"
    echo "  ⚠ Plan updated with new direction"
  fi
fi
```

**Before running the bash script:**
- Extract checkpoint number by counting exchanges in messages.md
- Format decisions as proper markdown with validated content
- Generate proper decision entries with context, options, choice, rationale
- Ensure context.md content updates completed in step 5 (if context changed)

**Key Optimizations:**
- ✅ Never reads messages.md or decisions.md before appending (uses `cat >>`)
- ✅ Uses Edit tool for context.md content updates (clear, verifiable changes)
- ✅ Uses `sed -i` for timestamp-only updates (no file read needed)
- ✅ Uses `grep -c` for task counting (no file read needed)
- ✅ Single bash script consolidates all file operations
- ✅ ~75% token reduction through eliminating redundant Read/Write cycles

**Note:** All artifacts created during conversation should already be auto-saved to the session's `artifacts/` folder.
