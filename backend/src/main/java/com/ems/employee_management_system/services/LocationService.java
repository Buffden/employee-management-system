package com.ems.employee_management_system.services;

import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import com.ems.employee_management_system.constants.Constants;
import com.ems.employee_management_system.dtos.FilterCriteria;
import com.ems.employee_management_system.models.Location;
import com.ems.employee_management_system.repositories.LocationRepository;
import com.ems.employee_management_system.security.SecurityService;
import com.ems.employee_management_system.utils.FilterBuilder;

@Service
public class LocationService {
    private static final Logger logger = LoggerFactory.getLogger(LocationService.class);
    
    private final LocationRepository locationRepository;
    private final SecurityService securityService;

    public LocationService(LocationRepository locationRepository, SecurityService securityService) {
        this.locationRepository = locationRepository;
        this.securityService = securityService;
    }

    public Page<Location> getAll(Pageable pageable) {
        logger.debug("Fetching locations with pagination: page={}, size={}", pageable.getPageNumber(), pageable.getPageSize());
        // Location is read-only for all roles, so use filtered method for consistency
        String role = securityService.getCurrentUserRole();
        return locationRepository.findAllFilteredByRole(role, pageable);
    }

    /**
     * Get locations with filters applied
     * Applies user-provided filters
     * 
     * @param pageable Pagination info
     * @param filters List of FilterCriteria to apply
     * @return Page of locations matching filters
     */
    public Page<Location> getAll(Pageable pageable, List<FilterCriteria> filters) {
        logger.debug("Fetching locations with filters and pagination: page={}, size={}, filterCount={}", 
                pageable.getPageNumber(), pageable.getPageSize(), filters != null ? filters.size() : 0);
        String role = securityService.getCurrentUserRole();

        // Build specification from filters
        Specification<Location> spec = Specification.where(null);
        
        // Apply user-provided filters
        if (filters != null && !filters.isEmpty()) {
            for (FilterCriteria filter : filters) {
                spec = spec.and(FilterBuilder.buildSpecification(filter));
            }
            logger.debug("Applied {} user-provided filters", filters.size());
        }

        // Apply role-based access control
        if (role == null) {
            logger.warn("User role is null, returning empty page");
            return org.springframework.data.domain.Page.empty(pageable);
        }
        
        return locationRepository.findAll(spec, pageable);
    }

    public List<Location> getAll() {
        logger.debug("Fetching all locations (no pagination)");
        return locationRepository.findAll();
    }

    public Location getById(UUID id) {
        logger.debug("Fetching location with id: {}", id);
        return locationRepository.findById(id).orElse(null);
    }

    /**
     * Saves a location with business logic validation
     * Validates location name uniqueness
     * Sets default country if not provided
     */
    @Transactional
    public Location save(Location location) {
        logger.debug("Saving location: {}", location.getName());
        
        // Set default country if not provided
        if (location.getCountry() == null || location.getCountry().isEmpty()) {
            location.setCountry(Constants.DEFAULT_COUNTRY);
            logger.debug("Set default country to: {} for location: {}", Constants.DEFAULT_COUNTRY, location.getName());
        }
        
        // Validate name uniqueness (excluding current location if updating)
        if (location.getName() != null) {
            locationRepository.findByName(location.getName())
                .ifPresent(existing -> {
                    // Allow update of same location, but prevent duplicate names for different locations
                    if (location.getId() == null || !existing.getId().equals(location.getId())) {
                        logger.warn("Location name already exists: {}", location.getName());
                        throw new IllegalArgumentException("Location with name '" + location.getName() + "' already exists");
                    }
                });
        }
        
        Location saved = locationRepository.save(location);
        logger.info("Location saved successfully with id: {}", saved.getId());
        return saved;
    }

    /**
     * Deletes a location with business logic validation
     * Validates referential integrity - cannot delete if referenced by employees or departments
     */
    @Transactional
    public void delete(UUID id) {
        logger.info("Deleting location with id: {}", id);
        
        Location location = locationRepository.findById(id)
            .orElseThrow(() -> {
                logger.warn("Location not found with id: {}", id);
                return new IllegalArgumentException("Location not found with id: " + id);
            });
        
        // Check referential integrity
        Long employeeCount = locationRepository.countEmployeesByLocation(id);
        Long departmentCount = locationRepository.countDepartmentsByLocation(id);
        
        if (employeeCount > 0 || departmentCount > 0) {
            StringBuilder error = new StringBuilder("Cannot delete location that is referenced by: ");
            if (employeeCount > 0) {
                error.append(employeeCount).append(" employee(s)");
            }
            if (departmentCount > 0) {
                if (employeeCount > 0) error.append(" and ");
                error.append(departmentCount).append(" department(s)");
            }
            logger.warn("Cannot delete location {}: {}", location.getName(), error.toString());
            throw new IllegalStateException(error.toString());
        }
        
        locationRepository.deleteById(id);
        logger.info("Location deleted successfully with id: {}", id);
    }
} 