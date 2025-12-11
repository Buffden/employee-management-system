# Dashboard Module - Low-Level Design

## 1. Overview

The Dashboard module provides metrics, visualizations, and aggregated data for the organization. It uses the Facade pattern to simplify access to multiple metric services, Factory Method pattern to create metric services, and Strategy pattern for different calculation strategies.

## 2. Components

### 2.1 MetricFactory (Factory Method Pattern)

**Location**: `backend/src/main/java/.../dashboard/MetricFactory.java`

**Interface**:

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `getMetric(String metricName)` | `metricName` | `MetricService` | Create appropriate metric service |

**Implementation**:

| Metric Name | Returns | Dependencies |
|-------------|---------|-------------|
| `"totalEmployees"` | `TotalEmployeesMetric` | `EmployeeRepository` |
| `"averageSalary"` | `AverageSalaryMetric` | `EmployeeRepository` |
| `"departmentDistribution"` | `DepartmentDistributionMetric` | `EmployeeRepository`, `DepartmentRepository` |
| `"employeeGrowth"` | `EmployeeGrowthMetric` | `EmployeeRepository` |

**Pattern**: Factory Method Pattern
- Creates appropriate MetricService implementation based on metric name

**Pattern**: Factory Method Pattern

**Purpose**: Creates appropriate MetricService implementation based on metric name

---

### 2.2 MetricService Interface (Strategy Pattern)

**Location**: `backend/src/main/java/.../dashboard/MetricService.java`

**Interface**:

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `calculate()` | - | `MetricResult` | Calculate metric value |

**MetricResult Structure**:

| Property | Type | Description |
|----------|------|-------------|
| `metricName` | `String` | Name of the metric |
| `value` | `Object` | Calculated metric value |
| `unit` | `String` | Unit of measurement |
| `calculatedAt` | `LocalDateTime` | Calculation timestamp |

**Pattern**: Strategy Pattern
- Different calculation strategies for different metrics

**Pattern**: Strategy Pattern

**Purpose**: Different calculation strategies for different metrics

---

### 2.3 Metric Implementations

#### TotalEmployeesMetric

**Location**: `backend/src/main/java/.../dashboard/metrics/TotalEmployeesMetric.java`

**Methods**:

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `calculate()` | - | `MetricResult` | Calculate total employee count |

**Dependencies**:
- `EmployeeRepository` - Data access

**Strategy**: Counts total employees from repository

#### AverageSalaryMetric

**Location**: `backend/src/main/java/.../dashboard/metrics/AverageSalaryMetric.java`

**Methods**:

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `calculate()` | - | `MetricResult` | Calculate average salary across all employees |

**Dependencies**:
- `EmployeeRepository` - Data access (uses `findAverageSalary()` query)

**Strategy**: Calculates average salary using repository query

#### DepartmentDistributionMetric

**Location**: `backend/src/main/java/.../dashboard/metrics/DepartmentDistributionMetric.java`

**Methods**:

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `calculate()` | - | `MetricResult` | Calculate employee distribution by department |

**Dependencies**:
- `EmployeeRepository` - Employee count by department
- `DepartmentRepository` - Department data

**Strategy**: Calculates employee count per department and percentage distribution

#### EmployeeGrowthMetric

**Location**: `backend/src/main/java/.../dashboard/metrics/EmployeeGrowthMetric.java`

**Methods**:

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `calculate()` | - | `MetricResult` | Calculate employee growth metrics (current vs previous month) |

**Dependencies**:
- `EmployeeRepository` - Employee count by joining date ranges

**Strategy**: Compares current month employee count with previous month to calculate growth rate

---

### 2.4 DashboardFacadeService (Facade Pattern)

**Location**: `backend/src/main/java/.../dashboard/DashboardFacadeService.java`

**Methods**:

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `getAllMetrics()` | - | `DashboardMetricsDTO` | Aggregate all metric calculations |
| `getGraphsData()` | - | `GraphDataDTO` | Generate chart data for visualizations |

**Dependencies**:
- `MetricFactory` - Creates metric service instances
- `EmployeeRepository` - Employee data
- `DepartmentRepository` - Department data

**Pattern**: Facade Pattern
- Simplifies access to multiple metric services
- Aggregates results from different metric calculations
- Provides unified interface for dashboard data

**Pattern**: Facade Pattern

**Purpose**: Simplifies access to multiple metric services, provides unified interface

---

## 3. Controllers

### 3.1 DashboardController

**Location**: `backend/src/main/java/.../controllers/DashboardController.java`

**Endpoints**:

**Endpoints**:

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/dashboard/metrics` | Get all dashboard metrics | - | `DashboardMetricsDTO` |
| GET | `/api/dashboard/graphs` | Get graph data for visualizations | - | `GraphDataDTO` |

**Dependencies**:
- `DashboardFacadeService` - Business logic aggregation

**Endpoints**:
- `GET /api/dashboard/metrics` - Get all dashboard metrics
- `GET /api/dashboard/graphs` - Get graph data for visualizations

---

## 4. DTOs

### 4.1 DashboardMetricsDTO

**Location**: `backend/src/main/java/.../dtos/DashboardMetricsDTO.java`

```java
@Builder
@Data
public class DashboardMetricsDTO {
    private Integer totalEmployees;
    private Integer totalDepartments;
    private Double averageSalary;
    private EmployeeGrowth employeeGrowth;
    private List<DepartmentDistribution> departmentDistribution;
}
```

### 4.2 GraphDataDTO

**Location**: `backend/src/main/java/.../dtos/GraphDataDTO.java`

```java
@Builder
@Data
public class GraphDataDTO {
    private ChartData employeeGrowthChart;
    private ChartData departmentDistributionChart;
    private SalaryDistributionChart salaryDistributionChart;
}
```

### 4.3 Supporting DTOs

```java
@Builder
@Data
public class EmployeeGrowth {
    private Integer currentMonth;
    private Integer previousMonth;
    private Double growthRate;
}

@Builder
@Data
public class DepartmentDistribution {
    private String departmentName;
    private Integer employeeCount;
    private Double percentage;
}

@Builder
@Data
public class ChartData {
    private List<String> labels;
    private List<Integer> data;
}

@Builder
@Data
public class SalaryDistributionChart {
    private List<String> ranges;
    private List<Integer> counts;
}
```

---

## 5. Repositories

### 5.1 Additional Repository Methods

**EmployeeRepository**:
```java
@Query("SELECT AVG(e.salary) FROM Employee e")
Double findAverageSalary();

@Query("SELECT COUNT(e) FROM Employee e WHERE e.department.id = :departmentId")
Long countByDepartment(@Param("departmentId") UUID departmentId);

@Query("SELECT COUNT(e) FROM Employee e WHERE e.joiningDate >= :date")
Long countByJoiningDateAfter(@Param("date") LocalDate date);

@Query("SELECT COUNT(e) FROM Employee e WHERE e.joiningDate BETWEEN :start AND :end")
Long countByJoiningDateBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);
```

**DepartmentRepository**:
```java
@Query("SELECT COUNT(d) FROM Department d")
Long count();
```

---

## 6. Design Patterns Summary

| Pattern | Location | Purpose |
|---------|----------|---------|
| **Factory Method** | MetricFactory | Create metric services |
| **Strategy** | MetricService implementations | Different calculation strategies |
| **Facade** | DashboardFacadeService | Simplify metric retrieval |

---

## 7. Role-Based Access Control

| Operation | System Admin | HR Manager | Department Manager | Employee |
|-----------|--------------|------------|-------------------|----------|
| **View All Metrics** | ✅ | ❌ | ❌ | ❌ |
| **View HR Metrics** | ✅ | ✅ | ❌ | ❌ |
| **View Department Metrics** | ✅ | ✅ | ✅ (own dept) | ❌ |
| **View Own Metrics** | ✅ | ✅ | ✅ | ✅ |

### 7.1 Implementation Details

**Service Layer Authorization**:

**Example - DashboardService**:
```java
@PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER', 'EMPLOYEE')")
public DashboardMetricsDTO getMetrics() {
    String role = securityService.getCurrentUserRole();
    UUID departmentId = securityService.getCurrentUserDepartmentId();
    UUID userId = securityService.getCurrentUserId();
    
    DashboardMetricsDTO metrics = new DashboardMetricsDTO();
    
    if (role.equals("SYSTEM_ADMIN")) {
        // All organization metrics
        metrics.setTotalEmployees(employeeRepository.count());
        metrics.setTotalDepartments(departmentRepository.count());
        metrics.setAverageSalary(employeeRepository.calculateAverageSalary());
    } else if (role.equals("HR_MANAGER")) {
        // HR metrics (all employees, all departments)
        metrics.setTotalEmployees(employeeRepository.count());
        metrics.setTotalDepartments(departmentRepository.count());
        metrics.setAverageSalary(employeeRepository.calculateAverageSalary());
    } else if (role.equals("DEPARTMENT_MANAGER")) {
        // Own department metrics only
        metrics.setTotalEmployees(employeeRepository.countByDepartmentId(departmentId));
        metrics.setTotalDepartments(1L); // Only own department
        metrics.setAverageSalary(employeeRepository.calculateAverageSalaryByDepartment(departmentId));
    } else if (role.equals("EMPLOYEE")) {
        // Personal metrics only
        metrics.setTotalEmployees(1L); // Only self
        metrics.setTotalDepartments(1L); // Own department
        // No salary for employee view
    }
    
    return metrics;
}
```

**Controller Layer**:
```java
@GetMapping("/metrics")
@PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER', 'EMPLOYEE')")
public ResponseEntity<DashboardMetricsDTO> getMetrics() {
    // Service automatically filters by role
    return ResponseEntity.ok(dashboardService.getMetrics());
}

@GetMapping("/graphs")
@PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER')")
public ResponseEntity<GraphDataDTO> getGraphs() {
    // Employees cannot view graphs, only metrics
    return ResponseEntity.ok(dashboardService.getGraphs());
}
```

**Metric Scope**:
- **System Admin**: All organization-wide metrics
- **HR Manager**: HR-related metrics (employee stats, department distribution, salary analytics)
- **Department Manager**: Own department metrics only
- **Employee**: Personal metrics (own tasks, own projects)

**Filtered Data**:
- Department Manager queries automatically filtered by `user.employee.department`
- Employee queries automatically filtered by `user.employee.id`
- Service layer automatically applies role-based filtering

**See**: `docs/security/roles-and-permissions.md` for complete permission matrix

## 8. Sequence Diagram

See: `docs/diagrams/sequence/dashboard-metrics-flow.puml`

---

## 9. Future Enhancements

- **Caching**: Cache metrics for performance (Redis)
- **Real-time Updates**: WebSocket for real-time metric updates
- **Custom Metrics**: Allow users to define custom metrics
- **Export**: Export dashboard data to PDF/Excel
- **Scheduled Calculations**: Pre-calculate metrics on schedule
- **Metric History**: Track metric changes over time

---

**Status**: Complete  
**Last Updated**: 2024-12-10
