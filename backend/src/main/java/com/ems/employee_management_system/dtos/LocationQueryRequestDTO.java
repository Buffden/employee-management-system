package com.ems.employee_management_system.dtos;

public class LocationQueryRequestDTO {
    private int page = 0;
    private int size = 20;
    private String sortBy;
    private String sortDir = "ASC";

    public LocationQueryRequestDTO() {
    }

    public LocationQueryRequestDTO(int page, int size, String sortBy, String sortDir) {
        this.page = page;
        this.size = size;
        this.sortBy = sortBy;
        this.sortDir = sortDir;
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

    public String getSortBy() {
        return sortBy;
    }

    public void setSortBy(String sortBy) {
        this.sortBy = sortBy;
    }

    public String getSortDir() {
        return sortDir;
    }

    public void setSortDir(String sortDir) {
        this.sortDir = sortDir;
    }
}

