# Activity Diagrams

This directory contains activity diagrams showing business workflows and processes.

## What are Activity Diagrams?

Activity diagrams show **BUSINESS WORKFLOWS** - the step-by-step flow of activities, decisions, and parallel processes in a business operation.

**Purpose**:
- Document business processes
- Show decision points
- Identify parallel activities
- Understand workflow complexity
- Design process automation

## Diagrams

### 1. Employee Onboarding Activity
**File**: `employee-onboarding-activity.puml`

**Shows**:
- Complete onboarding workflow
- Validation steps
- Manager assignment validation
- Onboarding process steps
- Status updates

**Activities**:
- **RBAC**: HR Manager or System Admin creates employee record
- Assign department and location
- Validate manager (if assigned)
- Save employee
- Onboarding process (email, workspace, accounts)
- Update status to Active

**RBAC Note**: Only HR Manager and System Admin can create employees. See `docs/security/roles-and-permissions.md` for complete permissions.

**Use When**:
- Implementing onboarding feature
- Understanding onboarding workflow
- Planning onboarding automation
- Training HR staff
- Understanding role-based access control

### 2. Project Creation Activity
**File**: `project-creation-activity.puml`

**Shows**:
- Project creation workflow
- Validation steps
- Project manager assignment
- Project setup activities
- Status management

**Activities**:
- **RBAC**: Department Manager or System Admin creates project
- Enter project details
- Assign department (must be Department Manager's own department)
- Validate project manager (if assigned)
- Validate project name uniqueness
- Save project
- Project setup (folder, structure, team)
- Update status to Active

**RBAC Note**: Department Manager can only create projects in their own department. System Admin can create projects in any department. See `docs/security/roles-and-permissions.md` for complete permissions.

**Use When**:
- Implementing project creation
- Understanding project workflow
- Planning project automation
- Training project managers
- Understanding role-based access control

## Activity Diagram Elements

### Activities
- **Actions**: Single-step activities (e.g., "Save employee")
- **Partitions**: Grouped activities (e.g., "Onboarding Process")

### Decision Points
- **If/Then/Else**: Conditional flows based on decisions
- **Validation**: Business rule checks

### Flow
- **Sequential**: Activities happen one after another
- **Parallel**: Activities can happen simultaneously (future enhancement)

## RBAC in Activity Diagrams

All activity diagrams include role-based access control:
- **Employee Onboarding**: Requires HR Manager or System Admin role
- **Project Creation**: Requires Department Manager (own dept) or System Admin role

**See**: `docs/security/roles-and-permissions.md` for complete permission matrix

## How to View

See main diagrams README for viewing instructions.

---

**Last Updated**: 2024-12-10

