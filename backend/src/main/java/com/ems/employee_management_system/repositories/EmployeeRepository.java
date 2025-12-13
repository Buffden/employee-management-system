package com.ems.employee_management_system.repositories;

import java.util.List;
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
           OR (:role = 'DEPARTMENT_MANAGER' AND :departmentId IS NOT NULL AND e.department IS NOT NULL AND e.department.id = :departmentId)
           OR (:role = 'EMPLOYEE' AND :userId IS NOT NULL AND e.id = :userId)
        """)
    Page<Employee> findAllFilteredByRole(@Param("role") String role,
                                         @Param("departmentId") UUID departmentId,
                                         @Param("userId") UUID userId,
                                         Pageable pageable);

    /**
     * Find all employees by department ID (for manager dropdown filtering)
     */
    @Query("SELECT e FROM Employee e WHERE e.department.id = :departmentId")
    List<Employee> findByDepartmentId(@Param("departmentId") UUID departmentId);

    /**
     * Count employees in a department (for delete validation)
     */
    @Query("SELECT COUNT(e) FROM Employee e WHERE e.department.id = :departmentId")
    Long countByDepartmentId(@Param("departmentId") UUID departmentId);

    /**
     * Count direct reports for a manager (for delete validation)
     */
    @Query("SELECT COUNT(e) FROM Employee e WHERE e.manager.id = :managerId")
    Long countDirectReports(@Param("managerId") UUID managerId);
}
