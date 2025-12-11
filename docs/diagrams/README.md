# Diagrams Documentation

This directory contains PlantUML (.puml) diagrams for visualizing system architecture, sequences, class structures, and deployment.

## Directory Structure

```
diagrams/
├── architecture/     # System architecture diagrams (C4, ER diagrams)
├── sequence/         # Sequence diagrams for workflows
├── class/            # Class diagrams for modules
├── deployment/       # Deployment architecture diagrams
├── state/            # State diagrams (state machines)
├── activity/         # Activity diagrams (business workflows)
└── use-cases/        # Use case diagrams
```

## How to Use

### Viewing Diagrams

1. **Online**: Use [PlantUML Online Server](http://www.plantuml.com/plantuml/uml/)
2. **VS Code**: Install "PlantUML" extension
3. **IntelliJ**: Built-in PlantUML support
4. **CLI**: Use PlantUML command-line tool

### Generating Images

```bash
# Install PlantUML (requires Java)
# macOS: brew install plantuml
# Linux: apt-get install plantuml

# Generate PNG from .puml file
plantuml diagram.puml

# Generate SVG
plantuml -tsvg diagram.puml
```

## Diagram Types

### Architecture Diagrams
- System overview (C4 Context, Container, Component)
- Component interactions
- Layer architecture
- Database ER diagrams

### Sequence Diagrams
- API request flows (with RBAC authorization)
- Authentication flow (JWT token validation and role extraction)
- Data processing flows (role-based filtering)
- Table pagination flow (role-based data filtering)
- Department creation flow (role-based authorization)
- Employee query flow (role-based repository filtering)
- Dashboard metrics flow (role-based metric filtering)

### Class Diagrams
- Module class structures
- Relationships between classes
- Design pattern applications
- Domain model (includes User entity for RBAC)
- Security layer (SecurityConfig, JwtAuthenticationFilter, SecurityService)

### Deployment Diagrams
- Docker architecture
- CI/CD pipeline flow
- Deployment overview

### State Diagrams
- Task status state machine
- Project status state machine
- Employee lifecycle state machine

### Activity Diagrams
- Employee onboarding workflow
- Project creation workflow

### Use Case Diagrams
- System use cases (role-based)
- Actor interactions (4 roles: System Admin, HR Manager, Department Manager, Employee)
- Functional requirements (with permission restrictions)

## Security & RBAC in Diagrams

All sequence diagrams include:
- **JWT Authentication Filter**: Token validation and role extraction
- **SecurityService**: Role-based access checks
- **@PreAuthorize**: Method-level authorization
- **Repository Filtering**: Role-based data filtering

**See**: 
- `sequence/authentication-flow.puml` for complete JWT and RBAC flow
- `class/complete-system-class-diagram.puml` for security layer components
- `docs/security/roles-and-permissions.md` for permission matrix

---

**Status**: Active  
**Last Updated**: 2024-12-10

