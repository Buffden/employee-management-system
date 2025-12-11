package com.ems.employee_management_system.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ems.employee_management_system.models.Project;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
    Optional<Project> findByName(String name);
} 