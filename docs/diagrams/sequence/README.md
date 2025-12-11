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

**Use When**:
- Implementing dashboard features
- Understanding pattern combinations
- Optimizing metric calculations

## How to View

See main diagrams README for viewing instructions.

---

**Last Updated**: 2024-12-10

