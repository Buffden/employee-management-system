# Sequence Diagrams

This directory contains sequence diagrams showing the flow of interactions between system components over time.

## What are Sequence Diagrams?

Sequence diagrams show **HOW** the system works - the step-by-step flow of messages between objects/components when executing a use case.

**Purpose**: 
- Show object interactions over time
- Document technical implementation details
- Identify design issues
- Understand message flow

## Diagrams

### 1. Employee Create Flow
**File**: `employee-create-flow.puml`

**Shows**:
- Complete flow from user action to database
- Validation process (manager in same department)
- Entity-DTO conversion (Mapper pattern)
- Repository interactions

**Use When**:
- Implementing employee creation
- Understanding validation flow
- Debugging creation issues

### 2. Employee Query Flow
**File**: `employee-query-flow.puml`

**Shows**:
- Filtering, sorting, pagination flow
- Strategy pattern application
- Factory pattern for creating strategies
- Template method pattern

**Use When**:
- Implementing table queries
- Understanding pattern applications
- Optimizing query performance

### 3. Dashboard Metrics Flow
**File**: `dashboard-metrics-flow.puml`

**Shows**:
- Facade pattern (DashboardFacadeService)
- Factory Method pattern (MetricFactory)
- Strategy pattern (different metric calculations)
- Multiple repository queries
- **RBAC**: Role-based metric filtering (System Admin/HR Manager/Department Manager/Employee)

**Use When**:
- Implementing dashboard features
- Understanding pattern combinations
- Optimizing metric calculations
- Understanding role-based data filtering

### 4. Authentication Flow
**File**: `authentication-flow.puml`

**Shows**:
- JWT token generation and validation
- **RBAC**: Role extraction from JWT claims
- **SecurityService**: Role-based access checks
- **@PreAuthorize**: Method-level authorization
- Repository-level role-based filtering

**Use When**:
- Implementing authentication
- Understanding JWT flow
- Understanding RBAC implementation
- Debugging authorization issues

### 5. Table Pagination Flow
**File**: `table-pagination-flow.puml`

**Shows**:
- Pagination state management
- Observer pattern for state updates
- Template method for pagination logic
- **RBAC**: Role-based data filtering (should be added)

**Use When**:
- Implementing table pagination
- Understanding state management
- Understanding pagination logic

## RBAC in Sequence Diagrams

All sequence diagrams now include:
- **JwtAuthenticationFilter**: Intercepts requests, validates JWT, extracts role
- **SecurityService**: Provides role-based helper methods
- **@PreAuthorize**: Method-level authorization checks
- **Repository Filtering**: Role-based query filtering

**See**: `docs/security/roles-and-permissions.md` for complete permission matrix

## How to View

See main diagrams README for viewing instructions.

---

**Last Updated**: 2024-12-10

