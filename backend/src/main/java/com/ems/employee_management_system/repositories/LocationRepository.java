package com.ems.employee_management_system.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ems.employee_management_system.models.Location;
import com.ems.employee_management_system.enums.UserRole;

public interface LocationRepository extends JpaRepository<Location, UUID> {
    Optional<Location> findByName(String name);
    
    @Query("SELECT COUNT(e) FROM Employee e WHERE e.location.id = :locationId")
    Long countEmployeesByLocation(@Param("locationId") UUID locationId);
    
    @Query("SELECT COUNT(d) FROM Department d WHERE d.location.id = :locationId")
    Long countDepartmentsByLocation(@Param("locationId") UUID locationId);

    @Query("""
        SELECT l FROM Location l
        WHERE (:role = '" + UserRole.SYSTEM_ADMIN.getValue() + "' OR :role = '" + UserRole.HR_MANAGER.getValue() + "')
           OR (:role = '" + UserRole.DEPARTMENT_MANAGER.getValue() + "')
           OR (:role = '" + UserRole.EMPLOYEE.getValue() + "')
        """)
    Page<Location> findAllFilteredByRole(@Param("role") String role,
                                         Pageable pageable);
} 