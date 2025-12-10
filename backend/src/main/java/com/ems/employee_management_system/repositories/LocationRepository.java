package com.ems.employee_management_system.repositories;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ems.employee_management_system.models.Location;

public interface LocationRepository extends JpaRepository<Location, UUID> {} 