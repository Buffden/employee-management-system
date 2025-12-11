# Creational Design Patterns

This document describes the creational design patterns applied in the Employee Management System.

## 1. Builder Pattern

### Purpose
Construct complex objects step by step, providing flexibility in object creation.

### Application in EMS

#### 1.1 EmployeeRequestDTO Builder

**Location**: `backend/src/main/java/.../dtos/EmployeeRequestDTO.java`

**Use Case**: Building employee DTOs with optional fields

```java
EmployeeRequestDTO employee = EmployeeRequestDTO.builder()
    .firstName("John")
    .lastName("Doe")
    .email("john.doe@example.com")
    .departmentId(departmentId)
    .salary(75000.0)
    .build();
```

**Benefits**:
- Immutable object creation
- Clear, readable code
- Cursor AI can autocomplete builder methods

#### 1.2 Test Data Fixtures

**Location**: `backend/src/test/java/.../fixtures/`

**Use Case**: Creating test entities with default values

```java
Employee testEmployee = EmployeeFixture.builder()
    .withName("Test Employee")
    .withDepartment(testDepartment)
    .withSalary(50000.0)
    .build();
```

### Implementation Guidelines

- Use Lombok `@Builder` annotation for automatic builder generation
- Provide sensible defaults for optional fields
- Validate required fields in `build()` method

## 2. Factory Method Pattern

### Purpose
Define an interface for creating objects, but let subclasses decide which class to instantiate.

### Application in EMS

#### 2.1 MetricFactory

**Location**: `backend/src/main/java/.../dashboard/MetricFactory.java`

**Use Case**: Creating appropriate metric service implementations

```java
public interface MetricFactory {
    MetricService getMetric(String metricName);
}

public class MetricFactoryImpl implements MetricFactory {
    @Override
    public MetricService getMetric(String metricName) {
        return switch (metricName) {
            case "totalEmployees" -> new TotalEmployeesMetric();
            case "averageSalary" -> new AverageSalaryMetric();
            case "departmentDistribution" -> new DepartmentDistributionMetric();
            default -> throw new IllegalArgumentException("Unknown metric: " + metricName);
        };
    }
}
```

**Benefits**:
- Easy to add new metric types without modifying existing code
- Centralized metric creation logic
- Supports dependency injection

#### 2.2 Strategy Factory

**Location**: `backend/src/main/java/.../table/StrategyFactory.java`

**Use Case**: Creating sorting/filtering strategies

```java
public class SortStrategyFactory {
    public SortStrategy createSortStrategy(String sortBy, String direction) {
        return switch (sortBy) {
            case "name" -> new NameSortStrategy(direction);
            case "salary" -> new SalarySortStrategy(direction);
            case "department" -> new DepartmentSortStrategy(direction);
            default -> new DefaultSortStrategy(direction);
        };
    }
}
```

### Implementation Guidelines

- Use factory interfaces for testability
- Consider using Spring's `@Component` for factory beans
- Document all supported types

## 3. Singleton Pattern

### Purpose
Ensure a class has only one instance and provide global access to it.

### Application in EMS

#### 3.1 Database Connection Pool (HikariCP)

**Location**: Spring Boot auto-configuration

**Use Case**: Single connection pool instance for the application

```java
@Configuration
public class DatabaseConfig {
    @Bean
    @Primary
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();
        // Configuration...
        return new HikariDataSource(config); // Singleton by Spring
    }
}
```

**Note**: HikariCP is already implemented as a singleton by Spring Boot.

#### 3.2 JWT Utility (Singleton-like)

**Location**: `backend/src/main/java/.../auth/JWTManager.java`

**Use Case**: Centralized JWT token generation and validation

**RBAC Integration**: JWT tokens include role claims for authorization

```java
@Component // Spring singleton
public class JWTManager {
    private static final String SECRET_KEY = "...";
    
    public String generateToken(User user) { ... }
    public Claims validateToken(String token) { ... }
}
```

**Benefits**:
- Single source of truth for JWT operations
- Thread-safe (Spring-managed singleton)
- Easy to mock in tests

### Implementation Guidelines

- **Prefer Spring `@Component`**: Let Spring manage singletons
- **Avoid manual singleton**: Use dependency injection instead
- **Thread Safety**: Ensure thread-safe operations

## 4. Pattern Selection Guidelines

### When to Use Builder
- Object has many optional parameters
- Need immutable objects
- Want fluent API for object construction

### When to Use Factory Method
- Need to create objects without specifying exact class
- Want to centralize object creation logic
- Support multiple implementations of same interface

### When to Use Singleton
- Need exactly one instance (connection pools, configuration)
- Global access point required
- Resource-intensive object creation

## 5. Cursor AI Integration

### Code Generation
Cursor AI can generate:
- Builder classes with Lombok annotations
- Factory implementations with switch expressions
- Singleton components with Spring annotations

### Refactoring Support
- Convert constructors to builders
- Extract factory methods from conditional logic
- Identify singleton candidates

---

**Status**: Active  
**Last Updated**: 2024-12-10  
**Patterns Covered**: Builder, Factory Method, Singleton

