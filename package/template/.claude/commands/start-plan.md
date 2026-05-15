---
description: Initiate planning mode for complex, multi-phase work
---

Start a new planning cycle in the current active session.

**Plan Name:** {{{ARGS}}}

Please execute the following bash script to activate planning mode:

```bash
#!/bin/bash

# Variables from context
PLAN_NAME="{{{ARGS}}}"  # User-provided plan name
CURRENT_DATE=$(date +%Y-%m-%d)
CURRENT_DATETIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)
TIMESTAMP=$(date +%Y-%m-%d-%H%M)

# Fixed session pointer
ACTIVE_FILE=".cli-ai-chat/active-session.txt"

# Validate active session exists
if [ ! -f "$ACTIVE_FILE" ]; then
  echo "ERROR: No active session found"
  echo "Please run /new-session or /continue-session first"
  exit 1
fi

# Get session path from fixed pointer
SESSION_PATH=$(cat "$ACTIVE_FILE")

if [ ! -d "$SESSION_PATH" ]; then
  echo "ERROR: Active session directory not found: $SESSION_PATH"
  exit 1
fi

PLANNING_DIR="$SESSION_PATH/planning-mode"
mkdir -p "$PLANNING_DIR"

# Archive existing planning files if present
if ls "$PLANNING_DIR"/*.md 2>/dev/null | grep -v "^$PLANNING_DIR/archive" | grep -q .; then
  echo "Found existing planning files. Archiving..."
  mkdir -p "$PLANNING_DIR/archive"

  for file in "$PLANNING_DIR"/*.md; do
    if [ -f "$file" ] && [[ ! "$file" =~ archive ]]; then
      archived_name="archived-$TIMESTAMP-$(basename "$file")"
      mv "$file" "$PLANNING_DIR/archive/$archived_name"
      echo "  Archived: $(basename "$file") → $archived_name"
    fi
  done

  echo "Old planning cycle archived"
  echo ""
fi

# Create plan.md with heredoc
PLAN_FILE="$PLANNING_DIR/$CURRENT_DATE-$PLAN_NAME-plan.md"
cat > "$PLAN_FILE" <<'PLAN_EOF'
# Planning Document: PLAN_NAME_PLACEHOLDER

## Created
DATETIME_PLACEHOLDER

## Overview
[User should fill: Brief description of what this planning cycle aims to accomplish]

## Goals
1. [Primary goal]
2. [Secondary goal]
3. [Additional goals as needed]

## Approach
[High-level methodology and strategy for accomplishing the goals]

## Phases

### Phase 1: [Phase Name]
**Objective:** [What this phase accomplishes]
**Tasks:** See todo.md
**Dependencies:** [What must be done first, or "None"]
**Success Criteria:** [How we know this phase is complete]

### Phase 2: [Phase Name]
**Objective:** [What this phase accomplishes]
**Tasks:** See todo.md
**Dependencies:** [What must be done first]
**Success Criteria:** [How we know this phase is complete]

### Phase 3: [Add more phases as needed]
**Objective:**
**Tasks:** See todo.md
**Dependencies:**
**Success Criteria:**

## Constraints
- [Technical constraints that limit the approach]
- [Resource constraints]
- [Timeline constraints]
- [Other limitations]

## Risks
- [Risk 1]: [Mitigation strategy]
- [Risk 2]: [Mitigation strategy]

## Notes
[Additional context, assumptions, or considerations that don't fit elsewhere]

---
*Last Updated: DATETIME_PLACEHOLDER*
PLAN_EOF

# Replace placeholders in plan.md
sed -i "s/PLAN_NAME_PLACEHOLDER/$PLAN_NAME/g" "$PLAN_FILE"
sed -i "s/DATETIME_PLACEHOLDER/$CURRENT_DATETIME/g" "$PLAN_FILE"

# Create todo.md with heredoc
TODO_FILE="$PLANNING_DIR/$CURRENT_DATE-$PLAN_NAME-todo.md"
cat > "$TODO_FILE" <<'TODO_EOF'
# Task List: PLAN_NAME_PLACEHOLDER

## Created
DATETIME_PLACEHOLDER

## Phase 1: [Phase Name]
1. [ ] Task description
2. [ ] Task description
3. [ ] Task description

## Phase 2: [Phase Name]
4. [ ] Task description
5. [ ] Task description
6. [ ] Task description

## Phase 3: [Phase Name]
7. [ ] Task description
8. [ ] Task description

---
*Last Updated: DATETIME_PLACEHOLDER*
*Tasks Remaining: [Count unchecked items]*
TODO_EOF

# Replace placeholders in todo.md
sed -i "s/PLAN_NAME_PLACEHOLDER/$PLAN_NAME/g" "$TODO_FILE"
sed -i "s/DATETIME_PLACEHOLDER/$CURRENT_DATETIME/g" "$TODO_FILE"

# Create done.md with heredoc
DONE_FILE="$PLANNING_DIR/$CURRENT_DATE-$PLAN_NAME-done.md"
cat > "$DONE_FILE" <<'DONE_EOF'
# Completed Tasks: PLAN_NAME_PLACEHOLDER

## Created
DATETIME_PLACEHOLDER

## Completions

(Tasks will be added here as they are completed from todo.md)

---
*Last Updated: DATETIME_PLACEHOLDER*
*Total Completed: 0*
DONE_EOF

# Replace placeholders in done.md
sed -i "s/PLAN_NAME_PLACEHOLDER/$PLAN_NAME/g" "$DONE_FILE"
sed -i "s/DATETIME_PLACEHOLDER/$CURRENT_DATETIME/g" "$DONE_FILE"

# Success confirmation
echo "✓ Planning mode activated: $PLAN_NAME"
echo ""
echo "Files created:"
echo "  - planning-mode/$CURRENT_DATE-$PLAN_NAME-plan.md"
echo "  - planning-mode/$CURRENT_DATE-$PLAN_NAME-todo.md"
echo "  - planning-mode/$CURRENT_DATE-$PLAN_NAME-done.md"
echo ""
echo "Next steps:"
echo "  1. Fill in the plan.md with your goals, approach, and phases"
echo "  2. Break down tasks in todo.md organized by phase"
echo "  3. Start working - I'll automatically:"
echo "     - Reference plan.md before major work"
echo "     - Update todo.md as tasks progress"
echo "     - Move completed tasks to done.md with timestamps"
echo "     - Alert you if work deviates from the plan"
echo ""
echo "You can now begin filling in the planning documents or start describing what you want to accomplish."
```

**Before running the bash script:**
1. **Validate plan name:** If {{{ARGS}}} is empty, ask user for a descriptive plan name using kebab-case (e.g., "api-refactoring", "feature-implementation")
2. **Substitute variables:** Replace `PLAN_NAME`, `CURRENT_DATE`, and `CURRENT_DATETIME` in the script with actual values

**Important behavioral notes:**
- Once these files are created, Claude should automatically check plan.md before starting major work
- Claude should update todo.md in real-time as work progresses
- Claude should move completed tasks from todo.md to done.md immediately with timestamps
- Claude should alert the user if current work deviates from the documented plan
- Planning mode remains active until a new `/start-plan` is run or session ends

**Usage Examples:**
- `/start-plan api-refactoring` → Creates planning files for API refactoring work
- `/start-plan database-migration` → Creates planning files for DB migration
- `/start-plan` → Prompts user for plan name
