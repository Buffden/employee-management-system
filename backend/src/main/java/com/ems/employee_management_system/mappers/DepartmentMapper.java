package com.ems.employee_management_system.mappers;

import com.ems.employee_management_system.dtos.DepartmentDTO;
import com.ems.employee_management_system.models.Department;
import com.ems.employee_management_system.models.Employee;
import com.ems.employee_management_system.models.Location;

public class DepartmentMapper {
    public static DepartmentDTO toDTO(Department department) {
        DepartmentDTO dto = new DepartmentDTO();
        dto.setId(department.getId());
        dto.setName(department.getName());
        dto.setDescription(department.getDescription());
        dto.setLocationName(department.getLocationName());
        dto.setLocationId(department.getLocation() != null ? department.getLocation().getId() : null);
        if (department.getLocation() != null) {
            dto.setLocationName(department.getLocation().getName());
        }
        dto.setCreatedAt(department.getCreatedAt());
        dto.setBudget(department.getBudget());
        dto.setBudgetUtilization(department.getBudgetUtilization());
        dto.setPerformanceMetric(department.getPerformanceMetric());
        dto.setDepartmentHeadId(department.getHead() != null ? department.getHead().getId() : null);
        return dto;
    }

    public static Department toEntity(DepartmentDTO dto, Location location, Employee head) {
        Department department = new Department();
        department.setId(dto.getId());
        department.setName(dto.getName());
        department.setDescription(dto.getDescription());
        department.setLocationName(dto.getLocationName());
        department.setLocation(location);
        if (location != null) {
            department.setLocationName(location.getName());
        }
        department.setCreatedAt(dto.getCreatedAt());
        department.setBudget(dto.getBudget());
        department.setBudgetUtilization(dto.getBudgetUtilization());
        department.setPerformanceMetric(dto.getPerformanceMetric());
        department.setHead(head);
        return department;
    }
} 