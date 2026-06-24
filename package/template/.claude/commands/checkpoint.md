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

5. **Update context.md using Edit tool BEFORE running bash script:**

   **CRITICAL**: This step must be completed BEFORE step 6 (bash script execution).

   a. **Read current context.md** to see the existing "Current Focus", "Session Focus", and "Key Points" sections.

   b. **Determine what needs updating** — use Edit tool for any section where a trigger applies:

      **Triggers:**
      - "Current Focus" placeholder `[To be filled during conversation]` is still present → first checkpoint, always populate
      - "Session Focus" placeholder `[To be filled on first checkpoint]` is still present → first checkpoint, always populate
      - User validated a context/scope change in step 3

   c. **Current Focus** — always replace entire paragraph:
      - Generate one paragraph describing what is actively being worked on right now
      - Use Edit tool to replace the entire "## Current Focus" paragraph
      - Use the ACTUAL resolved file path from `active-session.txt` (e.g., `chats/projects/my-project/2026-01-15-my-topic/context.md`)
      - **CRITICAL:** Do NOT pass `$CONTEXT_FILE` or any shell variable as the file path — the Edit tool does not evaluate shell syntax and will fail with "File does not exist"

   d. **Session Focus** — surgical merge:
      - **First checkpoint** (placeholder `[To be filled on first checkpoint]` still present): write 1–2 sentences describing what this session is about at a high level — the overall goal or purpose
      - **Subsequent checkpoints**: read the existing Session Focus text, then merge in changes surgically:
        - Merge new session-level context (new scope additions, evolved goals)
        - Update stale parts that no longer accurately describe the session
        - Remove parts that have become irrelevant
        - Only do a full replacement if the session's entire direction has fundamentally shifted
      - Apply using Edit tool with targeted in-place edits (not full-section replacement, except on first population or full direction change)

   e. **Key Points** — surgical merge:
      - Read the existing Key Points bullet list
      - For each **new point** from this checkpoint window, check against existing bullets:
        - Overlaps with an existing bullet → update that bullet in-place
        - Genuinely new → append as a new bullet at the end of the list
      - For each **existing bullet**, assess against the full session state:
        - Still accurate → keep unchanged
        - Outdated or contradicted → update in-place or remove
      - Apply using Edit tool — targeted replacements per bullet, not full-section replacement

   f. **If no triggers apply** (all sections populated, no context changes, no new key points):
      - Skip Edit tool — bash script will only update the timestamp
      - Do NOT update timestamp yet (bash script handles this)

6. **Update session files with validated content using bash:**

After user validates checkpoint content, execute the following bash script.

**IMPORTANT:** Each block re-reads `SESSION_PATH` from `active-session.txt` independently. This means blocks are safe to run in separate Bash tool calls — no variable state is assumed to persist between calls. Always run content appends (`cat >>`) before timestamp updates (`sed`) within each block.

```bash
#!/bin/bash

# --- Block 1: Messages ---
# Re-read path and time fresh — safe if run as a separate call
SESSION_PATH=$(cat .cli-ai-chat/active-session.txt | tr -d '[:space:]')
CURRENT_DATETIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Content first (NEVER read first - just append)
cat >> "${SESSION_PATH}/messages.md" <<MESSAGES_EOF

### Exchange [CHECKPOINT_NUMBER]
**User:** [User activities since last checkpoint]
**Assistant:** [WORK_SUMMARY]
**Outcome:** [Outcome description - generated from context]
MESSAGES_EOF

# Timestamp after — failure here is harmless, content already written
sed -i "s/\*Last Checkpoint:.*/\*Last Checkpoint: $CURRENT_DATETIME*/" "${SESSION_PATH}/messages.md" || true

# --- Block 2: Decisions ---
SESSION_PATH=$(cat .cli-ai-chat/active-session.txt | tr -d '[:space:]')
CURRENT_DATETIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)

DECISION_COUNT=$(grep -oP 'Decision Count: \K\d+' "${SESSION_PATH}/decisions.md" 2>/dev/null || echo 0)
NEW_COUNT=$((DECISION_COUNT + [NUMBER_OF_NEW_DECISIONS]))

# Content first
cat >> "${SESSION_PATH}/decisions.md" <<DECISIONS_EOF

[FORMATTED_DECISIONS_CONTENT]
DECISIONS_EOF

# Timestamps after
sed -i "s/Decision Count: [0-9]*/Decision Count: $NEW_COUNT/" "${SESSION_PATH}/decisions.md" || true
sed -i "s/\*Decision Count:.*/\*Decision Count: $NEW_COUNT | Last Updated: $CURRENT_DATETIME*/" "${SESSION_PATH}/decisions.md" || true

# --- Block 3: Context timestamp ---
# Content already updated by Edit tool in step 5 — this is timestamp only
SESSION_PATH=$(cat .cli-ai-chat/active-session.txt | tr -d '[:space:]')
CURRENT_DATETIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)

sed -i "s/\*Last Updated:.*/\*Last Updated: $CURRENT_DATETIME*/" "${SESSION_PATH}/context.md" || true

# --- Block 4: Registry ---
SESSION_PATH=$(cat .cli-ai-chat/active-session.txt | tr -d '[:space:]')
CURRENT_DATETIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)

jq --arg path "$SESSION_PATH" --arg time "$CURRENT_DATETIME" \
  '.sessions |= map(if .path == $path then .lastActive = $time else . end)' \
  ".cli-ai-chat/sessions.json" > ".cli-ai-chat/sessions.json.tmp" && \
  mv ".cli-ai-chat/sessions.json.tmp" ".cli-ai-chat/sessions.json"

echo "✓ Checkpoint saved"
echo "✓ Updated: messages.md, decisions.md, context.md"
echo "✓ Timestamp: $CURRENT_DATETIME"

# --- Block 5: Planning mode (if active) ---
SESSION_PATH=$(cat .cli-ai-chat/active-session.txt | tr -d '[:space:]')
CURRENT_DATETIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)
PLANNING_DIR="${SESSION_PATH}/planning-mode"

if ls "$PLANNING_DIR"/*-plan.md 2>/dev/null | grep -q .; then
  TODO_FILE=$(ls "$PLANNING_DIR"/*-todo.md 2>/dev/null | head -1)
  DONE_FILE=$(ls "$PLANNING_DIR"/*-done.md 2>/dev/null | head -1)

  PENDING_COUNT=$(grep -c "^[0-9]*\. \[ \]" "$TODO_FILE" 2>/dev/null || echo 0)
  COMPLETED_COUNT=$(grep -c "^[0-9]*\. \[x\]" "$DONE_FILE" 2>/dev/null || echo 0)

  echo ""
  echo "Planning Mode Status:"
  echo "  Pending tasks: $PENDING_COUNT"
  echo "  Completed tasks: $COMPLETED_COUNT"

  if [ -f "$TODO_FILE" ]; then
    sed -i "s/\*Last Updated:.*/\*Last Updated: $CURRENT_DATETIME*/" "$TODO_FILE" || true
  fi
  if [ -f "$DONE_FILE" ]; then
    sed -i "s/\*Last Updated:.*/\*Last Updated: $CURRENT_DATETIME*/" "$DONE_FILE" || true
  fi

  PLAN_FILE=$(ls "$PLANNING_DIR"/*-plan.md 2>/dev/null | head -1)
  if [ -f "$PLAN_FILE" ] && [ "$PLAN_NEEDS_UPDATE" = "true" ]; then
    sed -i "s/\*Last Updated:.*/\*Last Updated: $CURRENT_DATETIME*/" "$PLAN_FILE" || true
    echo "  ⚠ Plan updated with new direction"
  fi
fi
```

**Before running the bash script:**
- Extract checkpoint number by counting exchanges in messages.md
- Replace `[CHECKPOINT_NUMBER]`, `[WORK_SUMMARY]`, `[OUTCOME]` with actual validated content
- Replace `[NUMBER_OF_NEW_DECISIONS]` with the count of decisions being added
- Replace `[FORMATTED_DECISIONS_CONTENT]` with properly formatted decision markdown
- Ensure context.md content updates completed in step 5 (if context changed)

**Key Optimizations:**
- ✅ Each block re-reads `SESSION_PATH` from `active-session.txt` — no cross-call variable dependency
- ✅ Content appends (`cat >>`) always run before timestamp updates (`sed`) within each block
- ✅ `|| true` on every `sed` — timestamp failure never aborts the script
- ✅ Never reads messages.md or decisions.md before appending (uses `cat >>`)
- ✅ Uses Edit tool for context.md content updates (clear, verifiable changes)
- ✅ ~75% token reduction through eliminating redundant Read/Write cycles

**Note:** All artifacts created during conversation should already be auto-saved to the session's `artifacts/` folder.
