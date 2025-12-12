# UC-DB-002: View Employee Growth Chart

## Use Case Information

- **Use Case ID**: UC-DB-002
- **Title**: View Employee Growth Chart
- **Category**: Dashboard
- **Priority**: Medium
- **Status**: Active

---

## Actor(s)

- **HR Manager** (`HR_MANAGER`)
- **System Administrator** (`SYSTEM_ADMIN`)

**Role Requirements**:
- User must be authenticated
- User must have `HR_MANAGER` or `SYSTEM_ADMIN` role
- Authorization enforced via `@PreAuthorize(hasRole('SYSTEM_ADMIN') or hasRole('HR_MANAGER'))`

---

## Preconditions

1. User must be authenticated and logged in
2. User must have appropriate role

---

## Main Flow

1. **Navigate to Dashboard**: Actor navigates to Dashboard
   - Actor views dashboard (UC-DB-001)
   - Actor sees Employee Growth chart

2. **Click on Growth Chart**: Actor clicks on "Employee Growth" chart
   - System displays detailed growth chart view
   - System fetches time series data for employee count

3. **Display Growth Chart**: System displays employee count over time
   - System displays line chart or bar chart
   - Chart shows employee count by month/quarter/year
   - Actor can analyze growth trends

---

## Postconditions

### Success Postconditions
- Employee growth chart is displayed
- Time series data is shown
- User can analyze growth trends

---

## Business Rules

1. **Time Series Data**: Chart displays employee count over time (monthly, quarterly, or yearly)
2. **HR Manager & System Admin Only**: Only HR Managers and System Admins can view growth charts

---

## Related Use Cases

- **UC-DB-001**: View Dashboard Metrics (entry point to growth chart)

---

## Technical Notes

### API Endpoint
- **Method**: `GET`
- **Path**: `/api/dashboard/growth`
- **Response**: `EmployeeGrowthDTO` (HTTP 200 OK)

### Security
- **Authentication**: Required (JWT token)
- **Authorization**: `@PreAuthorize(hasRole('SYSTEM_ADMIN') or hasRole('HR_MANAGER'))`

---

**Last Updated**: 2024-12-12  
**Status**: Active

