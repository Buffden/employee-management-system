# UC-DB-001: View Dashboard Metrics

## Use Case Information

- **Use Case ID**: UC-DB-001
- **Title**: View Dashboard Metrics
- **Category**: Dashboard
- **Priority**: High
- **Status**: Active

---

## Actor(s)

- **HR Manager** (`HR_MANAGER`)
- **Department Manager** (`DEPARTMENT_MANAGER`)
- **System Administrator** (`SYSTEM_ADMIN`)

**Role Requirements**:
- User must be authenticated
- User must have one of the above roles
- Authorization enforced via `@PreAuthorize(hasAnyRole('SYSTEM_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER'))`

---

## Preconditions

1. User must be authenticated and logged in
2. User must have appropriate role

---

## Main Flow

1. **Navigation**: Actor navigates to Dashboard
   - Actor logs in and is redirected to dashboard
   - OR Actor clicks on "Dashboard" in navigation menu
   - System displays Dashboard page

2. **Load Dashboard Metrics**: System fetches dashboard metrics
   - Frontend calls `GET /api/dashboard/metrics`
   - System validates JWT token
   - System extracts user role and department from token
   - System applies role-based metric filtering:
     - **SYSTEM_ADMIN**: Sees all metrics across all departments
     - **HR_MANAGER**: Sees all metrics across all departments
     - **DEPARTMENT_MANAGER**: Sees metrics only for their department
   - System calculates metrics:
     - Total employees (filtered by role)
     - Total departments (filtered by role)
     - Average salary (filtered by role)
     - Employee growth chart data
     - Department distribution chart data

3. **Display Dashboard Metrics**: System displays metrics
   - System displays metric cards:
     - Total Employees
     - Total Departments
     - Average Salary
   - System displays charts:
     - Employee Growth Chart
     - Department Distribution Chart
   - Metrics are filtered based on user's role

4. **View Detailed Chart (Optional)**: Actor can click on charts for details
   - Actor clicks on "Employee Growth" chart
   - System triggers UC-DB-002 (View Employee Growth Chart)
   - System displays detailed growth chart

---

## Postconditions

### Success Postconditions
- Dashboard metrics are displayed to the user
- Metrics are filtered based on user's role
- Charts are rendered with appropriate data
- User can interact with charts for detailed views

---

## Business Rules

1. **Role-Based Metric Filtering**:
   - **SYSTEM_ADMIN**: Sees all metrics (all departments)
   - **HR_MANAGER**: Sees all metrics (all departments)
   - **DEPARTMENT_MANAGER**: Sees metrics only for their department

2. **Metric Calculations**:
   - Total employees: Count of employees (filtered by role)
   - Total departments: Count of departments (filtered by role)
   - Average salary: Average of all employee salaries (filtered by role)

---

## Related Use Cases

- **UC-DB-002**: View Employee Growth Chart (detailed growth chart view)

---

## Technical Notes

### API Endpoint
- **Method**: `GET`
- **Path**: `/api/dashboard/metrics`
- **Response**: `DashboardMetricsDTO` (HTTP 200 OK)

### Security
- **Authentication**: Required (JWT token)
- **Authorization**: `@PreAuthorize(hasAnyRole('SYSTEM_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER'))`
- **Role-Based Filtering**: Applied at service level

---

**Last Updated**: 2024-12-12  
**Status**: Active

