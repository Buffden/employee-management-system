package com.ems.employee_management_system.dtos;

import java.util.List;
import java.util.Map;

/**
 * Generic paginated response DTO following industrial best practices
 * Provides consistent pagination structure across all endpoints
 * Includes filters array for reusable table filtering across all tables
 * 
 * IMPORTANT: The filters map should ALWAYS contain ALL possible filter values, independent of pagination.
 * Filters represent complete filter options available for the table, not filtered by current page.
 * Filters only narrow down when other filters are applied (future filtering implementation).
 * This ensures filter dropdowns always show complete options regardless of current page.
 */
public class PaginatedResponseDTO<T> {
    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean first;
    private boolean last;
    private boolean hasNext;
    private boolean hasPrevious;
    private Map<String, List<FilterOptionDTO>> filters; // Reusable filters for table filtering (ALL values, not paginated)

    public PaginatedResponseDTO() {
    }

    public PaginatedResponseDTO(List<T> content, int page, int size, long totalElements, int totalPages,
            boolean first, boolean last, boolean hasNext, boolean hasPrevious) {
        this.content = content;
        this.page = page;
        this.size = size;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
        this.first = first;
        this.last = last;
        this.hasNext = hasNext;
        this.hasPrevious = hasPrevious;
    }

    public PaginatedResponseDTO(List<T> content, int page, int size, long totalElements, int totalPages,
            boolean first, boolean last, boolean hasNext, boolean hasPrevious, Map<String, List<FilterOptionDTO>> filters) {
        this.content = content;
        this.page = page;
        this.size = size;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
        this.first = first;
        this.last = last;
        this.hasNext = hasNext;
        this.hasPrevious = hasPrevious;
        this.filters = filters;
    }

    // Getters and setters
    public List<T> getContent() {
        return content;
    }

    public void setContent(List<T> content) {
        this.content = content;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }

    public long getTotalElements() {
        return totalElements;
    }

    public void setTotalElements(long totalElements) {
        this.totalElements = totalElements;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }

    public boolean isFirst() {
        return first;
    }

    public void setFirst(boolean first) {
        this.first = first;
    }

    public boolean isLast() {
        return last;
    }

    public void setLast(boolean last) {
        this.last = last;
    }

    public boolean isHasNext() {
        return hasNext;
    }

    public void setHasNext(boolean hasNext) {
        this.hasNext = hasNext;
    }

    public boolean isHasPrevious() {
        return hasPrevious;
    }

    public void setHasPrevious(boolean hasPrevious) {
        this.hasPrevious = hasPrevious;
    }

    public Map<String, List<FilterOptionDTO>> getFilters() {
        return filters;
    }

    public void setFilters(Map<String, List<FilterOptionDTO>> filters) {
        this.filters = filters;
    }
}

