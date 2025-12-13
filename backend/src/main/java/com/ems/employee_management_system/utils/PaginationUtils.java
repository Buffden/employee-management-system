package com.ems.employee_management_system.utils;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import com.ems.employee_management_system.constants.Constants;
import com.ems.employee_management_system.dtos.FilterOptionDTO;
import com.ems.employee_management_system.dtos.PaginatedResponseDTO;

/**
 * Utility class for pagination operations
 * Provides helper methods to create Pageable and convert Page to PaginatedResponseDTO
 */
public class PaginationUtils {

    /**
     * Creates a Pageable object with validation and sorting support
     * 
     * @param page Page number (0-indexed)
     * @param size Page size
     * @param sortBy Field to sort by (optional)
     * @param sortDir Sort direction (ASC or DESC, defaults to ASC)
     * @return Pageable object
     */
    public static Pageable createPageable(int page, int size, String sortBy, String sortDir) {
        // Validate and limit page size
        if (size > Constants.MAX_PAGE_SIZE) {
            size = Constants.MAX_PAGE_SIZE;
        }
        if (size < 1) {
            size = Constants.DEFAULT_PAGE_SIZE;
        }
        
        // Create Pageable with sorting
        if (sortBy != null && !sortBy.isEmpty()) {
            // Map frontend column names to backend entity field names
            String mappedSortBy = mapSortField(sortBy);
            Sort sort = sortDir != null && sortDir.equalsIgnoreCase("DESC") 
                    ? Sort.by(mappedSortBy).descending() 
                    : Sort.by(mappedSortBy).ascending();
            return PageRequest.of(page, size, sort);
        } else {
            return PageRequest.of(page, size);
        }
    }
    
    /**
     * Maps frontend column names to backend entity field names for sorting
     * This handles cases where frontend uses computed/display names that don't match entity fields
     * 
     * Note: "name" is used by multiple entities (Department, Location, Employee), so we only map
     * employee-specific computed fields. For "name", we return it as-is since most entities have a "name" field.
     * 
     * @param sortBy Frontend column name
     * @return Backend entity field name
     */
    private static String mapSortField(String sortBy) {
        if (sortBy == null || sortBy.isEmpty()) {
            return sortBy;
        }
        
        // Map frontend column names to backend entity fields
        // Use lowercase comparison for case-insensitive matching
        String lowerSortBy = sortBy.toLowerCase();
        
        switch (lowerSortBy) {
            // Employee-specific computed fields
            case "departmentname":
            case "department_name":
                // Frontend uses "departmentName", backend entity has department.name
                return "department.name";
            case "locationname":
            case "location_name":
                // Frontend uses "locationName", backend entity has location.name
                return "location.name";
            case "managername":
            case "manager_name":
                // Frontend uses "managerName", backend entity has manager.firstName
                return "manager.firstName";
            // Employee entity fields (camelCase to camelCase)
            case "firstname":
            case "first_name":
                return "firstName";
            case "lastname":
            case "last_name":
                return "lastName";
            case "joiningdate":
            case "joining_date":
                return "joiningDate";
            case "performancerating":
            case "performance_rating":
                return "performanceRating";
            case "worklocation":
            case "work_location":
                return "workLocation";
            case "experienceyears":
            case "experience_years":
                return "experienceYears";
            default:
                // For "name" and other common fields, use as-is
                // "name" exists in Department, Location, and other entities
                // Other common fields: email, phone, address, designation, salary, city, state, etc.
                return sortBy;
        }
    }

    /**
     * Converts a Spring Data Page to PaginatedResponseDTO
     * 
     * @param page Spring Data Page object
     * @param mapper Function to map entity to DTO
     * @param <T> Entity type
     * @param <R> DTO type
     * @return PaginatedResponseDTO
     */
    public static <T, R> PaginatedResponseDTO<R> toPaginatedResponse(Page<T> page, Function<T, R> mapper) {
        List<R> content = page.getContent().stream()
                .map(mapper)
                .collect(Collectors.toList());
        
        return new PaginatedResponseDTO<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast(),
                page.hasNext(),
                page.hasPrevious()
        );
    }

    /**
     * Converts a Spring Data Page to PaginatedResponseDTO with filters
     * 
     * IMPORTANT: Filters should ALWAYS contain ALL possible values, independent of pagination.
     * Filters represent complete filter options available for the table, not filtered by current page.
     * Filters only narrow down when other filters are applied (future filtering implementation).
     * 
     * @param page Spring Data Page object
     * @param mapper Function to map entity to DTO
     * @param filters Map of filter name to list of filter options (should contain ALL values, not paginated)
     * @param <T> Entity type
     * @param <R> DTO type
     * @return PaginatedResponseDTO with filters
     */
    public static <T, R> PaginatedResponseDTO<R> toPaginatedResponse(Page<T> page, Function<T, R> mapper, Map<String, List<FilterOptionDTO>> filters) {
        List<R> content = page.getContent().stream()
                .map(mapper)
                .collect(Collectors.toList());
        
        return new PaginatedResponseDTO<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast(),
                page.hasNext(),
                page.hasPrevious(),
                filters
        );
    }
}

