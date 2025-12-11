package com.ems.employee_management_system.controllers;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RestController;

import com.ems.employee_management_system.dtos.LocationRequestDTO;
import com.ems.employee_management_system.dtos.LocationResponseDTO;
import com.ems.employee_management_system.dtos.PaginatedResponseDTO;
import com.ems.employee_management_system.mappers.LocationMapper;
import com.ems.employee_management_system.models.Location;
import com.ems.employee_management_system.services.LocationService;
import com.ems.employee_management_system.utils.PaginationUtils;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/locations")
@PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER')")
public class LocationController {
    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(LocationController.class);
    
    private final LocationService locationService;

    public LocationController(LocationService locationService) {
        this.locationService = locationService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER')")
    public ResponseEntity<PaginatedResponseDTO<LocationResponseDTO>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false, defaultValue = "ASC") String sortDir) {
        logger.debug("Fetching locations with pagination: page={}, size={}, sortBy={}, sortDir={}", page, size, sortBy, sortDir);
        
        Pageable pageable = PaginationUtils.createPageable(page, size, sortBy, sortDir);
        Page<Location> locationPage = locationService.getAll(pageable);
        
        return ResponseEntity.ok(PaginationUtils.toPaginatedResponse(locationPage, LocationMapper::toResponseDTO));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER')")
    public ResponseEntity<LocationResponseDTO> getById(@PathVariable UUID id) {
        logger.debug("Fetching location with id: {}", id);
        Location location = locationService.getById(id);
        if (location == null) {
            logger.warn("Location not found with id: {}", id);
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(LocationMapper.toResponseDTO(location));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'HR_MANAGER')")
    public ResponseEntity<LocationResponseDTO> create(@Valid @RequestBody LocationRequestDTO requestDTO) {
        logger.info("Creating new location: {}", requestDTO.getName());
        Location location = LocationMapper.toEntity(requestDTO);
        Location savedLocation = locationService.save(location);
        logger.info("Location created successfully with id: {}", savedLocation.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(LocationMapper.toResponseDTO(savedLocation));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'HR_MANAGER')")
    public ResponseEntity<LocationResponseDTO> update(@PathVariable UUID id, @Valid @RequestBody LocationRequestDTO requestDTO) {
        logger.info("Updating location with id: {}", id);
        Location existingLocation = locationService.getById(id);
        if (existingLocation == null) {
            logger.warn("Location not found with id: {}", id);
            return ResponseEntity.notFound().build();
        }
        Location updatedLocation = LocationMapper.toEntity(requestDTO);
        updatedLocation.setId(id); // Ensure ID is preserved for update
        Location savedLocation = locationService.save(updatedLocation);
        logger.info("Location updated successfully with id: {}", id);
        return ResponseEntity.ok(LocationMapper.toResponseDTO(savedLocation));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        logger.info("Deleting location with id: {}", id);
        Location location = locationService.getById(id);
        if (location == null) {
            logger.warn("Location not found with id: {}", id);
            return ResponseEntity.notFound().build();
        }
        locationService.delete(id);
        logger.info("Location deleted successfully with id: {}", id);
        return ResponseEntity.noContent().build();
    }
} 