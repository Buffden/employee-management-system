# Class Diagrams

This directory contains PlantUML class diagrams visualizing the class structure and relationships in the Employee Management System.

## Diagrams

### 1. Domain Model Class Diagram
**File**: `domain-model-class-diagram.puml`

**Purpose**: Shows all domain entities and their relationships.

**Includes**:
- All 6 domain entities (Employee, Department, Location, Project, Task, EmployeeProject)
- Entity attributes with types and constraints
- Relationships between entities (@ManyToOne, @OneToMany)
- Self-referential relationships (Employee → Employee manager)
- Many-to-many relationships (EmployeeProject)

**Use When**:
- Understanding the data model
- Designing database schema
- Understanding entity relationships
- Onboarding new developers

### 2. Employee Module Class Diagram
**File**: `employee-module-class-diagram.puml`

**Purpose**: Complete class structure for the Employee module across all layers.

**Includes**:
- Domain Layer: Employee entity
- DTO Layer: EmployeeDTO, EmployeeRequestDTO, EmployeeResponseDTO, EmployeeTableRowDTO
- Controller Layer: EmployeeController
- Service Layer: EmployeeService, EmployeeQueryService, ValidationService
- Repository Layer: EmployeeRepository interface
- Mapper Layer: EmployeeMapper
- Strategy Pattern: SortStrategy, FilterStrategy implementations

**Use When**:
- Implementing employee features
- Understanding module architecture
- Applying design patterns
- Code reviews

### 3. Department Module Class Diagram
**File**: `department-module-class-diagram.puml`

**Purpose**: Complete class structure for the Department module.

**Includes**:
- Domain Layer: Department entity
- DTO Layer: DepartmentDTO, DepartmentRequestDTO, DepartmentResponseDTO
- Controller Layer: DepartmentController
- Service Layer: DepartmentService
- Repository Layer: DepartmentRepository interface
- Mapper Layer: DepartmentMapper

**Use When**:
- Implementing department features
- Understanding module structure
- Following the same pattern as Employee module

### 4. Complete System Class Diagram
**File**: `complete-system-class-diagram.puml`

**Purpose**: High-level view of the entire system across all layers.

**Includes**:
- All Controllers (6 controllers)
- All Services (6 services + DashboardFacadeService)
- All Repositories (6 repository interfaces)
- All Entities (6 entities)
- All DTOs (6 DTOs + Dashboard DTOs)
- All Mappers (6 mappers)
- Design Patterns: Facade, Factory Method, Strategy

**Use When**:
- Understanding overall system architecture
- Seeing the big picture
- Architecture reviews
- System documentation

## How to View

### Online (Recommended)
1. Go to [PlantUML Online Server](http://www.plantuml.com/plantuml/uml/)
2. Copy the contents of a `.puml` file
3. Paste into the editor
4. View the diagram

### VS Code
1. Install "PlantUML" extension
2. Open `.puml` file
3. Press `Alt+D` to preview
4. Or right-click → "Preview PlantUML"

### IntelliJ IDEA
1. Built-in PlantUML support
2. Open `.puml` file
3. View diagram automatically

### Command Line
```bash
# Install PlantUML (requires Java)
# macOS: brew install plantuml
# Linux: apt-get install plantuml

# Generate PNG
plantuml domain-model-class-diagram.puml

# Generate SVG
plantuml -tsvg domain-model-class-diagram.puml

# Generate PDF
plantuml -tpdf domain-model-class-diagram.puml
```

## Diagram Features

### Color Coding
- **Blue Background**: All classes use consistent blue theme
- **Organized by Packages**: Classes grouped by architectural layer

### Relationships Shown
- **Dependencies**: `-->` (uses)
- **Inheritance**: `..|>` (implements)
- **Composition**: `*--` (has many)
- **Association**: `-->` (references)

### Design Pattern Annotations
- Notes indicate pattern applications
- Strategy Pattern shown in Employee module
- Facade Pattern shown in Dashboard
- Factory Method shown in Metrics

## Diagram Maintenance

### When to Update
- New classes added
- Relationships change
- Design patterns applied
- Module structure changes

### How to Update
1. Edit the `.puml` file
2. Follow existing format
3. Test diagram renders correctly
4. Update this README if needed

## Related Documentation

- **Class Taxonomy**: `docs/class-taxonomy.md` - Detailed class classification
- **LLD Documentation**: `docs/lld/` - Module-specific low-level design
- **Design Patterns**: `docs/design-patterns/` - Pattern applications

---

**Last Updated**: 2024-12-10  
**Status**: Active

