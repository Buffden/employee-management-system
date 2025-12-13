package com.ems.employee_management_system.mappers;

import com.ems.employee_management_system.dtos.EmployeeRequestDTO;
import com.ems.employee_management_system.dtos.EmployeeResponseDTO;
import com.ems.employee_management_system.models.Department;
import com.ems.employee_management_system.models.Employee;
import com.ems.employee_management_system.models.Location;

public class EmployeeMapper {
    /**
     * Converts Employee entity to EmployeeResponseDTO
     * Includes denormalized names for better API responses
     */
    public static EmployeeResponseDTO toResponseDTO(Employee employee) {
        if (employee == null) {
            return null;
        }
        
        EmployeeResponseDTO dto = new EmployeeResponseDTO();
        dto.setId(employee.getId());
        dto.setFirstName(employee.getFirstName());
        dto.setLastName(employee.getLastName());
        dto.setEmail(employee.getEmail());
        dto.setPhone(employee.getPhone());
        dto.setAddress(employee.getAddress());
        dto.setDesignation(employee.getDesignation());
        dto.setSalary(employee.getSalary());
        dto.setJoiningDate(employee.getJoiningDate());
        dto.setPerformanceRating(employee.getPerformanceRating());
        
        // Include IDs for relationships
        if (employee.getLocation() != null) {
            dto.setLocationId(employee.getLocation().getId());
            dto.setLocationName(employee.getLocation().getName());
        }
        if (employee.getDepartment() != null) {
            dto.setDepartmentId(employee.getDepartment().getId());
            dto.setDepartmentName(employee.getDepartment().getName());
        }
        if (employee.getManager() != null) {
            dto.setManagerId(employee.getManager().getId());
            String managerFullName = employee.getManager().getFirstName() + " " + employee.getManager().getLastName();
            dto.setManagerName(managerFullName);
        } else {
            dto.setManagerId(null);
            dto.setManagerName(null);
        }
        
        dto.setWorkLocation(employee.getWorkLocation());
        dto.setExperienceYears(employee.getExperienceYears());
        return dto;
    }

    /**
     * Converts EmployeeRequestDTO to Employee entity
     * Relationships are resolved by IDs in the controller layer
     */
    public static Employee toEntity(EmployeeRequestDTO dto, Department department, Location location, Employee manager) {
        if (dto == null) {
            return null;
        }
        
        Employee employee = new Employee();
        employee.setFirstName(dto.getFirstName());
        employee.setLastName(dto.getLastName());
        employee.setEmail(dto.getEmail());
        employee.setPhone(dto.getPhone());
        employee.setAddress(dto.getAddress());
        employee.setDesignation(dto.getDesignation());
        employee.setSalary(dto.getSalary());
        employee.setJoiningDate(dto.getJoiningDate());
        employee.setPerformanceRating(dto.getPerformanceRating());
        employee.setDepartment(department);
        employee.setLocation(location);
        employee.setManager(manager);
        // Set workLocation - use location name as default if not provided (required field)
        String workLocation = dto.getWorkLocation();
        if (workLocation == null || workLocation.trim().isEmpty()) {
            // Default to location name if workLocation is not provided
            workLocation = location != null && location.getName() != null ? location.getName() : "Not Specified";
        }
        employee.setWorkLocation(workLocation);
        employee.setExperienceYears(dto.getExperienceYears());
        return employee;
    }
} 