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
- API request flows
- Authentication flow
- Data processing flows
- Table pagination flow
- Department creation flow

### Class Diagrams
- Module class structures
- Relationships between classes
- Design pattern applications
- Domain model

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
- System use cases
- Actor interactions
- Functional requirements

---

**Status**: Active  
**Last Updated**: 2024-12-10

