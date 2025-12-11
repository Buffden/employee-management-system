package com.ems.employee_management_system.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ems.employee_management_system.models.Department;

public interface DepartmentRepository extends JpaRepository<Department, UUID> {
    Optional<Department> findByName(String name);
    
    @Query("SELECT COUNT(e) FROM Employee e WHERE e.department.id = :departmentId")
    Long countEmployeesByDepartment(@Param("departmentId") UUID departmentId);
}
