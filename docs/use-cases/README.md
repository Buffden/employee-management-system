# Use Cases Documentation

This directory contains detailed documentation for each individual use case in the Employee Management System.

## Structure

Each use case is documented in its own markdown file, following the naming convention:
- `UC-{CATEGORY}-{NUMBER}.md` (e.g., `UC-EM-001.md` for Employee Management Use Case 001)

## Use Case Categories

- **EM**: Employee Management (8 use cases)
- **DM**: Department Management (4 use cases)
- **PM**: Project Management (7 use cases)
- **TM**: Task Management (5 use cases)
- **DB**: Dashboard (2 use cases)
- **AU**: Authentication (4 use cases)
- **SR**: Search (2 use cases)
- **LM**: Location Management (4 use cases)

**Total**: 36 use cases

## Use Case File Format

Each use case file contains:
- **Use Case ID & Title**: Unique identifier and descriptive name
- **Actor(s)**: Who can perform this use case
- **Preconditions**: What must be true before this use case can execute
- **Main Flow**: Step-by-step primary flow
- **Alternative Flows**: Variations and error handling
- **Postconditions**: What is true after successful completion
- **Business Rules**: Domain-specific rules and constraints
- **Validation Rules**: Input validation requirements
- **Error Conditions**: Possible error scenarios
- **Related Use Cases**: Dependencies and related functionality
- **Technical Notes**: Implementation considerations

## Quick Reference

### Employee Management
- [UC-EM-001: Create Employee](./UC-EM-001.md)
- [UC-EM-002: View Employee List](./UC-EM-002.md)
- [UC-EM-003: View Employee Details](./UC-EM-003.md)
- [UC-EM-004: Update Employee](./UC-EM-004.md)
- [UC-EM-005: Delete Employee](./UC-EM-005.md)
- [UC-EM-006: Assign Manager to Employee](./UC-EM-006.md)
- [UC-EM-007: View My Profile](./UC-EM-007.md)
- [UC-EM-008: Update My Profile](./UC-EM-008.md)

### Department Management
- [UC-DM-001: Create Department](./UC-DM-001.md)
- [UC-DM-002: View Department List](./UC-DM-002.md)
- [UC-DM-003: Update Department](./UC-DM-003.md)
- [UC-DM-004: Delete Department](./UC-DM-004.md)

### Project Management
- [UC-PM-001: Create Project](./UC-PM-001.md)
- [UC-PM-002: View Project List](./UC-PM-002.md)
- [UC-PM-003: Assign Employee to Project](./UC-PM-003.md)
- [UC-PM-004: Update Project](./UC-PM-004.md)
- [UC-PM-005: Delete Project](./UC-PM-005.md)
- [UC-PM-006: View Project Details](./UC-PM-006.md)
- [UC-PM-007: Remove Employee from Project](./UC-PM-007.md)

### Task Management
- [UC-TM-001: Create Task](./UC-TM-001.md)
- [UC-TM-002: Update Task Status](./UC-TM-002.md)
- [UC-TM-003: View Task Details](./UC-TM-003.md)
- [UC-TM-004: Update Task](./UC-TM-004.md)
- [UC-TM-005: Delete Task](./UC-TM-005.md)

### Dashboard
- [UC-DB-001: View Dashboard Metrics](./UC-DB-001.md)
- [UC-DB-002: View Employee Growth Chart](./UC-DB-002.md)

### Authentication
- [UC-AU-001: Login](./UC-AU-001.md)
- [UC-AU-002: Logout](./UC-AU-002.md)
- [UC-AU-003: Register/Add Admin](./UC-AU-003.md)
- [UC-AU-004: Change Password](./UC-AU-004.md)

### Search
- [UC-SR-001: Search Employees](./UC-SR-001.md)
- [UC-SR-002: Search Departments](./UC-SR-002.md)

### Location Management
- [UC-LM-001: Create Location](./UC-LM-001.md)
- [UC-LM-002: View Location List](./UC-LM-002.md)
- [UC-LM-003: Update Location](./UC-LM-003.md)
- [UC-LM-004: Delete Location](./UC-LM-004.md)

## Related Documentation

- **Use Case Summary**: `docs/requirements/use-cases.md` - Overview of all use cases
- **Use Case Diagrams**: `docs/diagrams/use-cases/use-case-diagram.puml` - Visual representation
- **Sequence Diagrams**: `docs/diagrams/sequence/` - Technical implementation flows
- **Roles & Permissions**: `docs/security/roles-and-permissions.md` - Access control matrix

---

**Last Updated**: 2024-12-12  
**Status**: Active

