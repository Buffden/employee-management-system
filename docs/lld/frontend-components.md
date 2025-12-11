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

