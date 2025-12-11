package com.ems.employee_management_system.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ems.employee_management_system.models.Employee;
import com.ems.employee_management_system.enums.UserRole;

public interface EmployeeRepository extends JpaRepository<Employee, UUID> {
    Optional<Employee> findByEmail(String email);

    @Query("""
        SELECT e FROM Employee e
        WHERE (:role = '" + UserRole.SYSTEM_ADMIN.getValue() + "' OR :role = '" + UserRole.HR_MANAGER.getValue() + "')
           OR (:role = '" + UserRole.DEPARTMENT_MANAGER.getValue() + "' AND e.department.id = :departmentId)
           OR (:role = '" + UserRole.EMPLOYEE.getValue() + "' AND e.id = :userId)
        """)
    Page<Employee> findAllFilteredByRole(@Param("role") String role,
                                         @Param("departmentId") UUID departmentId,
                                         @Param("userId") UUID userId,
                                         Pageable pageable);
}
