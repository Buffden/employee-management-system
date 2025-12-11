# Structural Design Patterns

This document describes the structural design patterns applied in the Employee Management System.

## 1. Adapter Pattern

### Purpose
Convert the interface of a class into another interface clients expect.

### Application in EMS

#### 1.1 API Response Adapter

**Location**: `backend/src/main/java/.../adapters/`

**Use Case**: Converting database entities to DTOs for API responses

```java
@Component
public class EmployeeAdapter {
    public EmployeeResponseDTO toResponseDTO(Employee entity) {
        return EmployeeResponseDTO.builder()
            .id(entity.getId())
            .name(entity.getFirstName() + " " + entity.getLastName())
            .email(entity.getEmail())
            .departmentName(entity.getDepartment().getName())
            .build();
    }
    
    public Employee toEntity(EmployeeRequestDTO dto) {
        Employee employee = new Employee();
        employee.setFirstName(dto.getFirstName());
        employee.setLastName(dto.getLastName());
        // ... map other fields
        return employee;
    }
}
```

**Benefits**:
- Separation of concerns (entity vs DTO)
- Easy to change API structure without affecting entities
- Cursor AI can generate adapters automatically

#### 1.2 Frontend Service Adapter

**Location**: `frontend/src/app/services/`

**Use Case**: Adapting backend API responses to Angular models

```typescript
@Injectable({ providedIn: 'root' })
export class EmployeeAdapterService {
  adaptApiResponse(apiEmployee: ApiEmployeeResponse): Employee {
    return {
      id: apiEmployee.id,
      fullName: `${apiEmployee.firstName} ${apiEmployee.lastName}`,
      email: apiEmployee.email,
      department: apiEmployee.department.name,
      // ... adapt other fields
    };
  }
}
```

### Implementation Guidelines

- Create separate adapter classes/services
- Use MapStruct for Java (optional, reduces boilerplate)
- Keep adapters focused on transformation only

## 2. Facade Pattern

### Purpose
Provide a unified interface to a set of interfaces in a subsystem.

### Application in EMS

#### 2.1 DashboardFacadeService

**Location**: `backend/src/main/java/.../dashboard/DashboardFacadeService.java`

**Use Case**: Simplifying dashboard metric retrieval

```java
@Service
public class DashboardFacadeService {
    private final TotalEmployeesMetric totalEmployeesMetric;
    private final AverageSalaryMetric averageSalaryMetric;
    private final DepartmentDistributionMetric departmentMetric;
    
    public DashboardMetricsDTO getAllMetrics() {
        return DashboardMetricsDTO.builder()
            .totalEmployees(totalEmployeesMetric.calculate())
            .averageSalary(averageSalaryMetric.calculate())
            .departmentDistribution(departmentMetric.calculate())
            .build();
    }
}
```

**Benefits**:
- Simplifies controller code
- Hides complexity of multiple metric services
- Single point of change for dashboard logic

#### 2.2 EmployeeManagementFacade

**Location**: `backend/src/main/java/.../employee/EmployeeManagementFacade.java`

**Use Case**: Wrapping employee and department operations

```java
@Service
public class EmployeeManagementFacade {
    private final EmployeeService employeeService;
    private final DepartmentService departmentService;
    private final ValidationService validationService;
    
    public EmployeeResponseDTO createEmployeeWithDepartment(
            EmployeeRequestDTO request, Long departmentId) {
        // Validate department exists
        Department department = departmentService.getById(departmentId);
        
        // Validate manager (if provided)
        if (request.getManagerId() != null) {
            validationService.validateManagerInDepartment(
                request.getManagerId(), departmentId);
        }
        
        // Create employee
        return employeeService.create(request);
    }
}
```

### Implementation Guidelines

- Facades should not contain business logic
- Delegate to appropriate services
- Keep facades thin and focused

## 3. Composite Pattern

### Purpose
Compose objects into tree structures to represent part-whole hierarchies.

### Application in EMS

#### 3.1 Department Hierarchy (Future)

**Location**: `backend/src/main/java/.../department/DepartmentHierarchy.java`

**Use Case**: Representing organizational hierarchy

```java
public interface DepartmentComponent {
    String getName();
    int getTotalEmployees();
    List<DepartmentComponent> getChildren();
}

public class Department implements DepartmentComponent {
    private String name;
    private List<DepartmentComponent> subDepartments;
    
    @Override
    public int getTotalEmployees() {
        int total = this.employees.size();
        for (DepartmentComponent subDept : subDepartments) {
            total += subDept.getTotalEmployees();
        }
        return total;
    }
}
```

#### 3.2 Table Column Configuration

**Location**: `frontend/src/app/shared/components/table/`

**Use Case**: Composing table column configurations

```typescript
export interface TableColumn {
  key: string;
  label: string;
  sortable: boolean;
  filterable: boolean;
  children?: TableColumn[]; // For nested columns
}

export class TableColumnComposite implements TableColumn {
  children: TableColumn[] = [];
  
  addColumn(column: TableColumn): void {
    this.children.push(column);
  }
  
  getColumns(): TableColumn[] {
    return this.children.flatMap(col => 
      col.children ? [col, ...col.children] : [col]
    );
  }
}
```

### Implementation Guidelines

- Use when you need tree-like structures
- Implement common interface for all components
- Support recursive operations

## 4. Pattern Selection Guidelines

### When to Use Adapter
- Need to convert between incompatible interfaces
- Integrating with third-party libraries
- Converting entities to DTOs

### When to Use Facade
- Need to simplify complex subsystem interactions
- Want to provide a single entry point
- Hiding implementation details from clients

### When to Use Composite
- Need to represent part-whole hierarchies
- Want to treat individual and composite objects uniformly
- Tree-like data structures

## 5. Cursor AI Integration

### Code Generation
Cursor AI can generate:
- Adapter classes for entity-DTO conversion
- Facade services wrapping multiple services
- Composite structures for hierarchical data

### Refactoring Support
- Extract adapter methods from service classes
- Create facades from complex service interactions
- Identify composite pattern opportunities

---

**Status**: Active  
**Last Updated**: 2024-12-10  
**Patterns Covered**: Adapter, Facade, Composite

