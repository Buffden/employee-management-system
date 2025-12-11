# Frontend Components - Low-Level Design

## 1. Overview

The frontend is built with Angular Standalone (v19) and follows component-based architecture with design patterns.

## 2. Generic Table Component

### 2.1 TableColumn Interface

**Location**: `frontend/src/app/shared/components/table/`

**Interface**:

| Property | Type | Description |
|----------|------|-------------|
| `key` | `string` | Column identifier |
| `label` | `string` | Display label |
| `sortable` | `boolean` | Whether column is sortable |
| `filterable` | `boolean` | Whether column is filterable |
| `children?` | `TableColumn[]` | Nested columns (Composite Pattern) |

### 2.2 SortStrategy (Strategy Pattern)

**Location**: `frontend/src/app/shared/components/table/`

**Interface**:

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `sort(data: any[], direction: 'ASC' \| 'DESC')` | `data`, `direction` | `any[]` | Sort data array |

**Implementations**: `NameSortStrategy`, `SalarySortStrategy`, etc.

### 2.3 TableService (Facade Pattern)

**Location**: `frontend/src/app/shared/services/`

**Methods**:

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `loadData(query: TableQuery)` | `query` | `Observable<TableData>` | Load table data |
| `updatePagination(page: number, size: number)` | `page`, `size` | `void` | Update pagination |
| `applySorting(sortBy: string, direction: string)` | `sortBy`, `direction` | `void` | Apply sorting |

**Pattern**: Facade Pattern - Simplifies API calls, state management, pagination

## 3. Observer Pattern

### 3.1 TableStateService

**Methods**:

| Property/Method | Type | Description |
|----------------|------|-------------|
| `tableState$` | `Observable<TableState>` | Observable for table state changes |

**Pattern**: Observer Pattern - Manages table state and notifies subscribers

### 3.2 OverlayService

**Methods**:

| Property/Method | Type | Description |
|----------------|------|-------------|
| `overlayEvents$` | `Observable<OverlayEvent>` | Observable for overlay events |

**Pattern**: Observer Pattern - Manages overlay open/close notifications

## 4. Adapter Pattern

### 4.1 EmployeeAdapterService

**Location**: `frontend/src/app/services/`

**Methods**:

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `adaptApiResponse(apiEmployee: ApiEmployeeResponse)` | `apiEmployee` | `Employee` | Adapt backend response to frontend model |

**Pattern**: Adapter Pattern - Converts API response format to frontend model

## 5. Components

### 5.1 Employee Table Component

**Location**: `frontend/src/app/features/employees/components/employee-table/`

**Component Properties**:

| Property | Type | Description |
|----------|------|-------------|
| `columns` | `@Input() TableColumn[]` | Table column configuration |
| `rowClick` | `@Output() EventEmitter<Employee>` | Row click event emitter |
| `tableData$` | `Observable<Page<EmployeeTableRowDTO>>` | Observable table data |

**Methods**:

| Method | Parameters | Description |
|--------|------------|-------------|
| `loadData(query: TableQueryRequest)` | `query` | Load table data with query |

**Dependencies**:
- `TableService` - Table state management
- `EmployeeService` - Employee data

### 5.2 Dashboard Component

**Location**: `frontend/src/app/features/dashboard/components/dashboard/`

**Component Properties**:

| Property | Type | Description |
|----------|------|-------------|
| `metrics$` | `Observable<DashboardMetricsDTO>` | Dashboard metrics data |
| `graphs$` | `Observable<GraphDataDTO>` | Chart/graph data |

**Dependencies**:
- `DashboardService` - Dashboard data

### 5.3 Employee Form Component

**Location**: `frontend/src/app/features/employees/components/employee-form/`

**Component Properties**:

| Property | Type | Description |
|----------|------|-------------|
| `form` | `FormGroup` | Reactive form group |
| `submit` | `@Output() EventEmitter<EmployeeRequestDTO>` | Form submit event |
| `cancel` | `@Output() EventEmitter<void>` | Form cancel event |

**Dependencies**:
- `FormBuilder` - Form construction

---

## 6. Services

### 6.1 EmployeeService

**Location**: `frontend/src/app/services/employee.service.ts`

**Methods**:

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `getAll()` | - | `Observable<EmployeeDTO[]>` | Get all employees |
| `getById(id: string)` | `id` | `Observable<EmployeeDTO>` | Get employee by ID |
| `create(employee: EmployeeRequestDTO)` | `employee` | `Observable<EmployeeDTO>` | Create employee |
| `update(id: string, employee: EmployeeRequestDTO)` | `id`, `employee` | `Observable<EmployeeDTO>` | Update employee |
| `delete(id: string)` | `id` | `Observable<void>` | Delete employee |
| `query(request: TableQueryRequest)` | `request` | `Observable<Page<EmployeeTableRowDTO>>` | Query employees with filters/sorting/pagination |

**Dependencies**:
- `HttpClient` - HTTP requests
- API Base URL: `/api/employees`

### 6.2 DashboardService

**Location**: `frontend/src/app/services/dashboard.service.ts`

**Methods**:

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `getMetrics()` | - | `Observable<DashboardMetricsDTO>` | Get dashboard metrics |
| `getGraphs()` | - | `Observable<GraphDataDTO>` | Get graph data |

**Dependencies**:
- `HttpClient` - HTTP requests
- API Base URL: `/api/dashboard`

### 6.3 AuthService

**Location**: `frontend/src/app/services/auth.service.ts`

**Methods**:

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `login(username: string, password: string)` | `username`, `password` | `Observable<AuthResponseDTO>` | User login |
| `logout()` | - | `void` | User logout |
| `getToken()` | - | `string \| null` | Get stored token |
| `isAuthenticated()` | - | `boolean` | Check if user is authenticated |

**Dependencies**:
- `HttpClient` - HTTP requests
- `localStorage` - Token storage
- API Base URL: `/api/auth`

---

## 7. Models

### 7.1 Employee Model

**Location**: `frontend/src/app/models/employee.model.ts`

**Employee Interface**:

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Employee ID |
| `firstName` | `string` | First name |
| `lastName` | `string` | Last name |
| `email` | `string` | Email address |
| `designation` | `string` | Job title |
| `salary` | `number` | Annual salary |
| `departmentName` | `string` | Department name |
| `locationName` | `string` | Location name |

**Related Interfaces**:
- `EmployeeRequestDTO` - Request DTO for create/update operations
- `EmployeeTableRowDTO` - Optimized DTO for table display (includes `name` field combining firstName + lastName)

### 7.2 Table Models

**Location**: `frontend/src/app/models/table.model.ts`

**TableQueryRequest Interface**:

| Property | Type | Description |
|----------|------|-------------|
| `filters?` | `{ [key: string]: string }` | Optional filter map |
| `sortBy?` | `string` | Column to sort by |
| `sortDirection?` | `'ASC' \| 'DESC'` | Sort direction |
| `page?` | `number` | Page number (0-indexed) |
| `size?` | `number` | Page size |

**Page<T> Interface**:

| Property | Type | Description |
|----------|------|-------------|
| `content` | `T[]` | Page data array |
| `totalElements` | `number` | Total number of elements |
| `totalPages` | `number` | Total number of pages |
| `size` | `number` | Page size |
| `number` | `number` | Current page number (0-indexed) |
| `first` | `boolean` | Is first page |
| `last` | `boolean` | Is last page |

---

## 8. Design Patterns Summary

| Pattern | Location | Purpose |
|---------|----------|---------|
| **Strategy** | SortStrategy, FilterStrategy | Sorting/filtering algorithms |
| **Observer** | TableStateService, OverlayService | State management |
| **Facade** | TableService | Simplified API |
| **Adapter** | EmployeeAdapterService | API response adaptation |
| **Composite** | TableColumn | Column configuration |

---

## 8.1 Role-Based UI Access Control

### 8.1.1 Route Guards

**Location**: `frontend/src/app/core/guards/`

| Guard | Purpose | Roles |
|-------|---------|-------|
| `AuthGuard` | Require authentication | All authenticated users |
| `RoleGuard` | Require specific role | Role-specific routes |
| `DepartmentGuard` | Require department ownership | Department Manager |

**Route Configuration**:
- `/employees` - Requires `HR_MANAGER` or `SYSTEM_ADMIN`
- `/departments` - Requires `HR_MANAGER` or `SYSTEM_ADMIN` or `DEPARTMENT_MANAGER`
- `/projects` - Requires `DEPARTMENT_MANAGER` or `SYSTEM_ADMIN`
- `/tasks` - Requires `DEPARTMENT_MANAGER` or `SYSTEM_ADMIN`
- `/dashboard` - All authenticated users (filtered by role)
- `/profile` - All authenticated users (own data only)

### 8.1.2 Component Visibility

| Component | System Admin | HR Manager | Department Manager | Employee |
|-----------|--------------|------------|-------------------|----------|
| **Employee Table** | ✅ | ✅ | ❌ | ❌ |
| **Employee Form (Create)** | ✅ | ✅ | ❌ | ❌ |
| **Employee Form (Edit)** | ✅ | ✅ | ✅ (own dept) | ✅ (own) |
| **Department Table** | ✅ | ✅ | ✅ | ❌ |
| **Department Form** | ✅ | ✅ | ✅ (own dept, limited) | ❌ |
| **Project Table** | ✅ | ✅ | ✅ | ❌ |
| **Project Form** | ✅ | ❌ | ✅ (own dept) | ❌ |
| **Task Table** | ✅ | ✅ | ✅ | ❌ |
| **Task Form** | ✅ | ❌ | ✅ (own dept) | ❌ |
| **Dashboard (All Metrics)** | ✅ | ❌ | ❌ | ❌ |
| **Dashboard (HR Metrics)** | ✅ | ✅ | ❌ | ❌ |
| **Dashboard (Dept Metrics)** | ✅ | ✅ | ✅ | ❌ |
| **Dashboard (Own Metrics)** | ✅ | ✅ | ✅ | ✅ |

### 8.1.3 UI Element Visibility

**Conditional Rendering**:
- **Delete Buttons**: Only visible to roles with delete permissions
- **Edit Buttons**: Only visible to roles with update permissions
- **Create Buttons**: Only visible to roles with create permissions
- **Salary Column**: Hidden for `DEPARTMENT_MANAGER` and `EMPLOYEE` roles
- **Budget Fields**: Hidden for `DEPARTMENT_MANAGER` and `EMPLOYEE` roles

**Implementation**:
- `*ngIf` directives based on user role
- Role service: `AuthService.getCurrentUserRole()`
- Permission service: `PermissionService.hasPermission(permission)`

**See**: `docs/security/roles-and-permissions.md` for complete permission matrix

### 8.1.4 Implementation Details

#### 8.1.4.1 Route Guard Implementation

**AuthGuard**:
```typescript
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}
  
  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    }
    this.router.navigate(['/login']);
    return false;
  }
}
```

**RoleGuard**:
```typescript
@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}
  
  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredRoles = route.data['roles'] as string[];
    const userRole = this.authService.getCurrentUserRole();
    
    if (requiredRoles.includes(userRole)) {
      return true;
    }
    this.router.navigate(['/unauthorized']);
    return false;
  }
}
```

**DepartmentGuard**:
```typescript
@Injectable({ providedIn: 'root' })
export class DepartmentGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private employeeService: EmployeeService,
    private router: Router
  ) {}
  
  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const employeeId = route.params['id'];
    const userRole = this.authService.getCurrentUserRole();
    
    if (userRole !== 'DEPARTMENT_MANAGER') {
      return of(true); // Other roles handled by RoleGuard
    }
    
    return this.employeeService.getById(employeeId).pipe(
      map(employee => {
        const userDepartmentId = this.authService.getCurrentUserDepartmentId();
        if (employee.departmentId === userDepartmentId) {
          return true;
        }
        this.router.navigate(['/unauthorized']);
        return false;
      })
    );
  }
}
```

#### 8.1.4.2 Permission Service

**Location**: `frontend/src/app/core/services/permission.service.ts`

**Methods**:

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `hasRole(role: string)` | `role` | `boolean` | Check if user has specific role |
| `hasAnyRole(roles: string[])` | `roles` | `boolean` | Check if user has any of the roles |
| `hasPermission(permission: string)` | `permission` | `boolean` | Check if user has specific permission |
| `canCreate(entity: string)` | `entity` | `boolean` | Check if user can create entity |
| `canUpdate(entity: string, id?: string)` | `entity`, `id` | `boolean` | Check if user can update entity |
| `canDelete(entity: string)` | `entity` | `boolean` | Check if user can delete entity |
| `canViewField(field: string)` | `field` | `boolean` | Check if user can view field (e.g., salary) |

**Implementation Example**:
```typescript
@Injectable({ providedIn: 'root' })
export class PermissionService {
  constructor(private authService: AuthService) {}
  
  hasRole(role: string): boolean {
    return this.authService.getCurrentUserRole() === role;
  }
  
  hasAnyRole(roles: string[]): boolean {
    const userRole = this.authService.getCurrentUserRole();
    return roles.includes(userRole);
  }
  
  canViewField(field: string): boolean {
    const role = this.authService.getCurrentUserRole();
    if (field === 'salary') {
      return role === 'SYSTEM_ADMIN' || role === 'HR_MANAGER';
    }
    if (field === 'budget') {
      return role === 'SYSTEM_ADMIN' || role === 'HR_MANAGER';
    }
    return true;
  }
  
  canCreate(entity: string): boolean {
    const role = this.authService.getCurrentUserRole();
    const permissions = {
      'employee': ['SYSTEM_ADMIN', 'HR_MANAGER'],
      'department': ['SYSTEM_ADMIN'],
      'location': ['SYSTEM_ADMIN', 'HR_MANAGER'],
      'project': ['SYSTEM_ADMIN', 'DEPARTMENT_MANAGER'],
      'task': ['SYSTEM_ADMIN', 'DEPARTMENT_MANAGER']
    };
    return permissions[entity]?.includes(role) || false;
  }
}
```

#### 8.1.4.3 Component-Level Implementation

**Example - Employee Table Component**:
```typescript
@Component({...})
export class EmployeeTableComponent {
  canCreate$ = this.permissionService.canCreate('employee');
  canViewSalary$ = this.permissionService.canViewField('salary');
  userRole$ = this.authService.getCurrentUserRole$();
  
  constructor(
    private permissionService: PermissionService,
    private authService: AuthService
  ) {}
}
```

**Template Example**:
```html
<button *ngIf="canCreate$ | async" (click)="createEmployee()">
  Add Employee
</button>

<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th *ngIf="canViewSalary$ | async">Salary</th>
      <th>Department</th>
    </tr>
  </thead>
  <!-- ... -->
</table>
```

#### 8.1.4.4 Auth Service Integration

**Location**: `frontend/src/app/core/services/auth.service.ts`

**Methods for RBAC**:

| Method | Return Type | Description |
|--------|-------------|-------------|
| `getCurrentUserRole()` | `string` | Get current user role from JWT token |
| `getCurrentUserRole$()` | `Observable<string>` | Observable of current user role |
| `getCurrentUserId()` | `string` | Get current user ID |
| `getCurrentUserDepartmentId()` | `string \| null` | Get current user's department ID (for Department Manager) |
| `hasRole(role: string)` | `boolean` | Check if user has specific role |
| `isSystemAdmin()` | `boolean` | Check if user is System Admin |
| `isHRManager()` | `boolean` | Check if user is HR Manager |
| `isDepartmentManager()` | `boolean` | Check if user is Department Manager |
| `isEmployee()` | `boolean` | Check if user is Employee |

**JWT Token Parsing**:
- Role extracted from JWT token claims
- Stored in service state for quick access
- Updated on login and token refresh

---

## 9. Sequence Diagrams

See:
- `docs/diagrams/sequence/table-pagination-flow.puml` - Table pagination flow
- `docs/diagrams/sequence/employee-query-flow.puml` - Employee query flow

## 10. Class Diagrams

See:
- `docs/diagrams/class/employee-module-class-diagram.puml` - Employee module class structure
- `docs/diagrams/class/complete-system-class-diagram.puml` - Complete system class diagram

---

## 11. Future Enhancements

- **Real-time Updates**: WebSocket for real-time data updates
- **Offline Support**: Service workers for offline functionality
- **Progressive Web App**: PWA capabilities
- **Advanced Filtering**: Multi-column filtering with operators
- **Export Functionality**: Export table data to CSV/Excel

---

**Status**: Complete  
**Last Updated**: 2024-12-10

