# Use Case Diagrams

This directory contains use case diagrams showing actors and their interactions with the system.

## What are Use Case Diagrams?

Use case diagrams show **WHAT** the system does - the functional requirements from a user's perspective.

**Purpose**:
- Show system functionality
- Identify actors and their roles
- Document business requirements
- High-level system understanding

## Diagrams

### Use Case Diagram
**File**: `use-case-diagram.puml`

**Shows**:
- All 4 actors (System Admin, HR Manager, Department Manager, Employee)
- 21 use cases organized by functional area
- Actor-use case relationships
- System boundaries
- **RBAC**: Role-based access control with permission restrictions

**Use When**:
- Understanding system functionality
- Onboarding new team members
- Requirements discussions
- Business stakeholder presentations

## Use Case Documentation

Detailed use case descriptions are in:
- `docs/requirements/use-cases.md` - Complete use case specifications

## Use Case vs Sequence Diagram

| Aspect | Use Case Diagram | Sequence Diagram |
|--------|------------------|------------------|
| **Shows** | WHAT the system does | HOW the system works |
| **Level** | Business/Functional | Technical/Implementation |
| **Audience** | Business, Product Owners | Developers, Architects |
| **Focus** | User interactions | Object interactions |
| **Detail** | High-level | Detailed step-by-step |

**Both are valuable** - Use cases show requirements, sequences show implementation.

## RBAC in Use Case Diagrams

**Role-Based Access**:
- **System Admin**: Full access to all use cases
- **HR Manager**: Employee and department management use cases
- **Department Manager**: Own department's projects and tasks
- **Employee**: Limited to own profile and assigned tasks

**Permission Enforcement**:
- JWT tokens include role claims
- @PreAuthorize annotations enforce permissions
- Repository-level filtering by role scope

**See**: 
- `docs/security/roles-and-permissions.md` for complete permission matrix
- `docs/lld/auth-module.md` for RBAC implementation details

---

**Last Updated**: 2024-12-10

