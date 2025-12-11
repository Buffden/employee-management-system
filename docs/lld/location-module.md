# Location Module - Low-Level Design

## 1. Overview

The Location module handles physical office location management including CRUD operations for locations where employees work and departments are based.

## 2. Entities

### 2.1 Location Entity

**Location**: `backend/src/main/java/com/ems/employee_management_system/models/Location.java`

```java
@Entity
public class Location {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @Column(nullable = false, unique = true)
    private String name;
    
    private String address;
    
    @Column(nullable = false)
    private String city;
    
    @Column(nullable = false)
    private String state;
    
    @Column(nullable = false)
    private String country = "USA";
    
    private String postalCode;
    
    // Getters and setters
}
```

**Relationships**:
- Referenced by `Employee` (Many-to-One)
- Referenced by `Department` (Many-to-One)

## 3. DTOs

### 3.1 LocationDTO

**Location**: `backend/src/main/java/com/ems/employee_management_system/dtos/LocationDTO.java`

**Pattern**: Simple DTO (no builder pattern needed for simple entity)

```java
public class LocationDTO {
    private UUID id;
    private String name;
    private String address;
    private String city;
    private String state;
    private String country;
    private String postalCode;
    
    // Getters and setters
}
```

**Fields**:
- `id` (UUID): Location unique identifier
- `name` (String, required, unique): Location name
- `address` (String, optional): Street address
- `city` (String, required): City name
- `state` (String, required): State/Province
- `country` (String, required, default: "USA"): Country
- `postalCode` (String, optional): ZIP/Postal code

## 4. Controllers

### 4.1 LocationController

**Location**: `backend/src/main/java/com/ems/employee_management_system/controllers/LocationController.java`

**Endpoints**:

| Method | Endpoint | Description | Status Code |
|--------|----------|-------------|-------------|
| GET | `/api/locations` | Get all locations | 200 |
| GET | `/api/locations/{id}` | Get location by ID | 200, 404 |
| POST | `/api/locations` | Create new location | 201, 400 |
| PUT | `/api/locations/{id}` | Update location | 200, 404, 400 |
| DELETE | `/api/locations/{id}` | Delete location | 204, 404 |

**Endpoints**:

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/locations` | Get all locations | - | `List<LocationDTO>` |
| GET | `/api/locations/{id}` | Get location by ID | - | `LocationDTO` |
| POST | `/api/locations` | Create location | `LocationDTO` | `LocationDTO` |
| PUT | `/api/locations/{id}` | Update location | `LocationDTO` | `LocationDTO` |
| DELETE | `/api/locations/{id}` | Delete location | - | `void` |

**Dependencies**:
- `LocationService` - Business logic
- `LocationMapper` - Entity ↔ DTO conversion

**Patterns Applied**:
- **Adapter Pattern**: LocationMapper converts Entity ↔ DTO

## 5. Services

### 5.1 LocationService

**Location**: `backend/src/main/java/com/ems/employee_management_system/services/LocationService.java`

**Methods**:

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `getAll()` | - | `List<Location>` | Get all locations |
| `getById(UUID id)` | `id` | `Location` | Get location by ID |
| `save(Location location)` | `location` | `Location` | Save location |
| `delete(UUID id)` | `id` | `void` | Delete location |

**Dependencies**:
- `LocationRepository` - Data access

**Patterns Applied**:
- **Adapter Pattern**: LocationMapper for Entity ↔ DTO conversions

## 6. Repositories

### 6.1 LocationRepository

**Location**: `backend/src/main/java/com/ems/employee_management_system/repositories/LocationRepository.java`

```java
@Repository
public interface LocationRepository extends JpaRepository<Location, UUID> {
    Optional<Location> findByName(String name);
}
```

**Methods**:
- `findAll()`: Get all locations (inherited from JpaRepository)
- `findById(UUID id)`: Get location by ID (inherited)
- `findByName(String name)`: Find location by name
- `save(Location location)`: Save location (inherited)
- `deleteById(UUID id)`: Delete location (inherited)

## 7. Mappers

### 7.1 LocationMapper

**Location**: `backend/src/main/java/com/ems/employee_management_system/mappers/LocationMapper.java`

**Pattern**: Adapter Pattern

**Methods**:

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `toDTO(Location location)` | `location` | `LocationDTO` | Convert Entity to DTO |
| `toEntity(LocationDTO dto)` | `dto` | `Location` | Convert DTO to Entity |

**Pattern**: Adapter Pattern
- Maps Location entity to LocationDTO
- Maps LocationDTO to Location entity

## 8. Design Patterns Summary

| Pattern | Location | Purpose |
|---------|----------|---------|
| **Adapter** | LocationMapper | Entity ↔ DTO conversion |

## 9. Validation Rules

- `name`: Required, max 100 characters, unique
- `city`: Required, max 100 characters
- `state`: Required, max 100 characters
- `country`: Required, max 100 characters, default: "USA"
- `address`: Optional, max 255 characters
- `postalCode`: Optional, max 20 characters

## 10. Business Rules

1. **Name Uniqueness**: Location name must be unique across all locations
2. **Referential Integrity**: Cannot delete location if referenced by employees or departments
3. **Default Country**: If country not provided, defaults to "USA"

## 11. Sequence Diagram

See: `docs/diagrams/sequence/` (to be created for location operations)

## 12. Future Enhancements

- **Geographic Data**: Add latitude/longitude for mapping
- **Time Zone**: Associate time zone with location
- **Capacity**: Track maximum employee capacity
- **Facilities**: List of facilities/amenities at location

---

**Status**: Complete  
**Last Updated**: 2024-12-10

