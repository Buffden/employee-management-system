package com.ems.employee_management_system.mappers;

import com.ems.employee_management_system.dtos.EmployeeDTO;
import com.ems.employee_management_system.models.Department;
import com.ems.employee_management_system.models.Employee;
import com.ems.employee_management_system.models.Location;

public class EmployeeMapper {
    public static EmployeeDTO toDTO(Employee employee) {
        EmployeeDTO dto = new EmployeeDTO();
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
        dto.setDepartmentId(employee.getDepartment() != null ? employee.getDepartment().getId() : null);
        dto.setLocationId(employee.getLocation() != null ? employee.getLocation().getId() : null);
        dto.setManagerId(employee.getManager() != null ? employee.getManager().getId() : null);
        dto.setWorkLocation(employee.getWorkLocation());
        dto.setExperienceYears(employee.getExperienceYears());
        return dto;
    }

    public static Employee toEntity(EmployeeDTO dto, Department department, Location location, Employee manager) {
        Employee employee = new Employee();
        employee.setId(dto.getId());
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
        employee.setWorkLocation(dto.getWorkLocation());
        employee.setExperienceYears(dto.getExperienceYears());
        return employee;
    }
} 