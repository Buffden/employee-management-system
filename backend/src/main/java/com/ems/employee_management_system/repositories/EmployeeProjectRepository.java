package com.ems.employee_management_system.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ems.employee_management_system.models.EmployeeProject;
import com.ems.employee_management_system.models.EmployeeProject.EmployeeProjectId;

public interface EmployeeProjectRepository extends JpaRepository<EmployeeProject, EmployeeProjectId> {} 