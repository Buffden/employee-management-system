# Behavioral Design Patterns

This document describes the behavioral design patterns applied in the Employee Management System.

## 1. Strategy Pattern

### Purpose
Define a family of algorithms, encapsulate each one, and make them interchangeable.

### Application in EMS

#### 1.1 Sorting Strategy

**Location**: `backend/src/main/java/.../table/SortStrategy.java`

**Use Case**: Different sorting algorithms for table data

```java
public interface SortStrategy {
    <T> List<T> sort(List<T> data, String direction);
}

public class NameSortStrategy implements SortStrategy {
    @Override
    public <T> List<T> sort(List<T> data, String direction) {
        return data.stream()
            .sorted(Comparator.comparing(Employee::getFirstName)
                .thenComparing(Employee::getLastName))
            .collect(Collectors.toList());
    }
}

public class SalarySortStrategy implements SortStrategy {
    @Override
    public <T> List<T> sort(List<T> data, String direction) {
        Comparator<Employee> comparator = Comparator.comparing(Employee::getSalary);
        if ("DESC".equals(direction)) {
            comparator = comparator.reversed();
        }
        return data.stream()
            .sorted(comparator)
            .collect(Collectors.toList());
    }
}
```

**Benefits**:
- Easy to add new sorting strategies
- No need to modify existing code
- Testable in isolation

#### 1.2 Role-Based Filtering Strategy

**Location**: `backend/src/main/java/.../repositories/`

**Use Case**: Different filtering strategies based on user role

**RBAC Integration**:
- `findAllFilteredByRole()` uses Strategy pattern for role-based filtering
- SYSTEM_ADMIN/HR_MANAGER: No filtering (all records)
- DEPARTMENT_MANAGER: Filter by department
- EMPLOYEE: Filter by own record

**See**: `docs/lld/auth-module.md` Section 14.4.3 for repository filtering

#### 1.2 Filtering Strategy

**Location**: `backend/src/main/java/.../table/FilterStrategy.java`

**Use Case**: Different filtering algorithms

```java
public interface FilterStrategy {
    <T> List<T> filter(List<T> data, String filterValue);
}

public class DepartmentFilterStrategy implements FilterStrategy {
    @Override
    public <T> List<T> filter(List<T> data, String filterValue) {
        return data.stream()
            .filter(emp -> emp.getDepartment().getName().equalsIgnoreCase(filterValue))
            .collect(Collectors.toList());
    }
}
```

#### 1.3 Metric Calculation Strategy

**Location**: `backend/src/main/java/.../dashboard/MetricService.java`

**Use Case**: Different metric calculation algorithms

```java
public interface MetricService {
    MetricResult calculate();
}

public class TotalEmployeesMetric implements MetricService {
    private final EmployeeRepository repository;
    
    @Override
    public MetricResult calculate() {
        long count = repository.count();
        return new MetricResult("totalEmployees", count);
    }
}

public class AverageSalaryMetric implements MetricService {
    private final EmployeeRepository repository;
    
    @Override
    public MetricResult calculate() {
        Double avg = repository.findAverageSalary();
        return new MetricResult("averageSalary", avg);
    }
}
```

### Implementation Guidelines

- Define strategy interface clearly
- Make strategies stateless when possible
- Use factory to create strategies

## 2. Observer Pattern

### Purpose
Define a one-to-many dependency between objects so that when one object changes state, all dependents are notified.

### Application in EMS

#### 2.1 Table Refresh Observer

**Location**: `frontend/src/app/shared/components/table/`

**Use Case**: Notifying components when table data changes

```typescript
@Injectable({ providedIn: 'root' })
export class TableStateService {
  private tableStateSubject = new BehaviorSubject<TableState>(initialState);
  public tableState$ = this.tableStateSubject.asObservable();
  
  updateTableState(state: TableState): void {
    this.tableStateSubject.next(state);
  }
}

// Component subscribes to changes
export class EmployeeTableComponent {
  constructor(private tableState: TableStateService) {
    this.tableState.tableState$.subscribe(state => {
      this.loadData(state);
    });
  }
}
```

#### 2.2 Overlay State Observer

**Location**: `frontend/src/app/shared/services/`

**Use Case**: Managing overlay/modal open/close state

```typescript
@Injectable({ providedIn: 'root' })
export class OverlayService {
  private overlaySubject = new Subject<OverlayEvent>();
  public overlayEvents$ = this.overlaySubject.asObservable();
  
  openOverlay(type: string, data: any): void {
    this.overlaySubject.next({ type: 'open', overlayType: type, data });
  }
  
  closeOverlay(): void {
    this.overlaySubject.next({ type: 'close' });
  }
}
```

#### 2.3 Metrics Update Observer

**Location**: `frontend/src/app/dashboard/`

**Use Case**: Real-time dashboard updates

```typescript
@Injectable({ providedIn: 'root' })
export class MetricsService {
  private metricsSubject = new BehaviorSubject<DashboardMetrics>(null);
  public metrics$ = this.metricsSubject.asObservable();
  
  refreshMetrics(): void {
    this.http.get<DashboardMetrics>('/api/dashboard/metrics')
      .subscribe(metrics => this.metricsSubject.next(metrics));
  }
}
```

### Implementation Guidelines

- Use RxJS Observables for Angular
- Prefer BehaviorSubject for state that needs initial value
- Unsubscribe to prevent memory leaks

## 3. Template Method Pattern

### Purpose
Define the skeleton of an algorithm in an operation, deferring some steps to subclasses.

### Application in EMS

#### 3.1 BaseTableQueryService

**Location**: `backend/src/main/java/.../table/BaseTableQueryService.java`

**Use Case**: Common table query logic with customizable steps

```java
public abstract class BaseTableQueryService<T> {
    
    // Template method - defines the algorithm
    public Page<T> query(TableQueryRequest request) {
        List<T> data = fetchData();
        data = applyFilters(data, request.getFilters());
        data = applySorting(data, request.getSortBy(), request.getSortDirection());
        data = applyPagination(data, request.getPage(), request.getSize());
        return new Page<>(data, request.getPage(), request.getSize());
    }
    
    // Abstract methods - subclasses must implement
    protected abstract List<T> fetchData();
    protected abstract List<T> applyFilters(List<T> data, Map<String, String> filters);
    
    // Hook methods - subclasses can override
    protected List<T> applySorting(List<T> data, String sortBy, String direction) {
        // Default sorting implementation
        return data;
    }
    
    protected List<T> applyPagination(List<T> data, int page, int size) {
        int start = page * size;
        int end = Math.min(start + size, data.size());
        return data.subList(start, end);
    }
}

// Concrete implementation
@Service
public class EmployeeQueryService extends BaseTableQueryService<Employee> {
    @Autowired
    private EmployeeRepository repository;
    
    @Override
    protected List<Employee> fetchData() {
        return repository.findAll();
    }
    
    @Override
    protected List<Employee> applyFilters(List<Employee> data, Map<String, String> filters) {
        // Custom filtering logic
        return data;
    }
}
```

**Benefits**:
- Code reuse for common query logic
- Consistent query structure across entities
- Easy to extend with new query types

#### 3.2 Base CRUD Service Template

**Location**: `backend/src/main/java/.../base/BaseCrudService.java`

**Use Case**: Common CRUD operations template

```java
public abstract class BaseCrudService<T, ID> {
    
    protected abstract CrudRepository<T, ID> getRepository();
    
    // Template method
    public T create(T entity) {
        validateBeforeCreate(entity);
        T saved = getRepository().save(entity);
        afterCreate(saved);
        return saved;
    }
    
    // Hook methods
    protected void validateBeforeCreate(T entity) {
        // Default: no validation
    }
    
    protected void afterCreate(T entity) {
        // Default: no post-processing
    }
}
```

### Implementation Guidelines

- Use abstract classes for template methods
- Make hook methods protected
- Document which methods can be overridden

## 4. Pattern Selection Guidelines

### When to Use Strategy
- Multiple ways to perform the same task
- Want to switch algorithms at runtime
- Need to add new algorithms without modifying existing code

### When to Use Observer
- Need to notify multiple objects about state changes
- Loose coupling between subject and observers
- Event-driven architecture

### When to Use Template Method
- Common algorithm structure with varying steps
- Want to enforce algorithm structure
- Code reuse across similar operations

## 5. Cursor AI Integration

### Code Generation
Cursor AI can generate:
- Strategy interfaces and implementations
- Observer services with RxJS
- Template method base classes

### Refactoring Support
- Extract strategies from conditional logic
- Convert callbacks to observer pattern
- Identify template method opportunities

---

**Status**: Active  
**Last Updated**: 2024-12-10  
**Patterns Covered**: Strategy, Observer, Template Method

