package com.ems.employee_management_system.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ems.employee_management_system.models.Employee;

public interface EmployeeRepository extends JpaRepository<Employee, UUID> {
    Optional<Employee> findByEmail(String email);

    @Query("""
        SELECT e FROM Employee e
        WHERE (:role = 'SYSTEM_ADMIN' OR :role = 'HR_MANAGER')
           OR (:role = 'DEPARTMENT_MANAGER' AND e.department.id = :departmentId)
           OR (:role = 'EMPLOYEE' AND e.id = :userId)
        """)
    Page<Employee> findAllFilteredByRole(@Param("role") String role,
                                         @Param("departmentId") UUID departmentId,
                                         @Param("userId") UUID userId,
                                         Pageable pageable);
}
