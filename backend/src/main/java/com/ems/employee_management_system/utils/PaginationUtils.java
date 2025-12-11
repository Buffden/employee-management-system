package com.ems.employee_management_system.utils;

import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import com.ems.employee_management_system.constants.Constants;
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
            Sort sort = sortDir != null && sortDir.equalsIgnoreCase("DESC") 
                    ? Sort.by(sortBy).descending() 
                    : Sort.by(sortBy).ascending();
            return PageRequest.of(page, size, sort);
        } else {
            return PageRequest.of(page, size);
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
}

