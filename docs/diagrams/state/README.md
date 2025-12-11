# State Diagrams

This directory contains state diagrams showing state machines for entities with status transitions.

## What are State Diagrams?

State diagrams show **STATE TRANSITIONS** - how entities move between different states over time, including valid transitions and conditions.

**Purpose**:
- Document entity lifecycles
- Show valid state transitions
- Identify invalid state changes
- Understand business rules
- Design state management

## Diagrams

### 1. Task Status State
**File**: `task-status-state.puml`

**Shows**:
- Task lifecycle states
- Valid transitions between states
- Final states (Completed, Cancelled)
- State transition rules

**States**:
- Not Started (initial)
- In Progress
- On Hold
- Completed (final)
- Cancelled (final)

**Use When**:
- Implementing task status management
- Validating state transitions
- Understanding task lifecycle
- Designing task workflow

### 2. Project Status State
**File**: `project-status-state.puml`

**Shows**:
- Project lifecycle states
- Valid transitions
- Pause/resume functionality
- Completion and cancellation

**States**:
- Planning (initial)
- Active
- On Hold
- Completed (final)
- Cancelled (final)

**Use When**:
- Implementing project status management
- Validating project state changes
- Understanding project lifecycle
- Planning project workflows

### 3. Employee Lifecycle State
**File**: `employee-lifecycle-state.puml`

**Shows**:
- Employee lifecycle states
- Onboarding process
- Leave management
- Termination process

**States**:
- Onboarding (initial)
- Active
- On Leave
- Terminated (final)

**Use When**:
- Implementing employee status management
- Validating employee state changes
- Understanding employee lifecycle
- Designing HR workflows

## State Transition Rules

### General Rules
- Initial states: Entry point when entity is created
- Final states: Terminal states (cannot transition from)
- Intermediate states: Can transition to other states
- Self-transitions: Not allowed (must change state)

### Validation
- Always validate state transitions in service layer
- Throw exceptions for invalid transitions
- Log state changes for audit trail
- Update timestamps on state changes

### RBAC Considerations

**Role-Based State Transitions**:
- Some state transitions may be restricted by role
- Department Manager: Can update own department's project/task states
- Employee: Can update assigned task status only
- System Admin/HR Manager: Can update any state

**See**: `docs/security/roles-and-permissions.md` for role permissions

## How to View

See main diagrams README for viewing instructions.

---

**Last Updated**: 2024-12-10

