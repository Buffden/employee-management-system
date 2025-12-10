package com.ems.employee_management_system.controllers;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ems.employee_management_system.dtos.EmployeeDTO;
import com.ems.employee_management_system.mappers.EmployeeMapper;
import com.ems.employee_management_system.models.Department;
import com.ems.employee_management_system.models.Employee;
import com.ems.employee_management_system.models.Location;
import com.ems.employee_management_system.services.DepartmentService;
import com.ems.employee_management_system.services.EmployeeService;
import com.ems.employee_management_system.services.LocationService;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {
    private final EmployeeService employeeService;
    private final DepartmentService departmentService;
    private final LocationService locationService;

    public EmployeeController(EmployeeService employeeService, DepartmentService departmentService, LocationService locationService) {
        this.employeeService = employeeService;
        this.departmentService = departmentService;
        this.locationService = locationService;
    }

    @GetMapping
    public List<EmployeeDTO> getAll() {
        return employeeService.getAll().stream()
                .map(EmployeeMapper::toDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public EmployeeDTO getById(@PathVariable UUID id) {
        Employee employee = employeeService.getById(id);
        return employee != null ? EmployeeMapper.toDTO(employee) : null;
    }

    @PostMapping
    public EmployeeDTO create(@RequestBody EmployeeDTO dto) {
        Department department = departmentService.getById(dto.getDepartmentId());
        Location location = locationService.getById(dto.getLocationId());
        Employee manager = dto.getManagerId() != null ? employeeService.getById(dto.getManagerId()) : null;
        Employee employee = EmployeeMapper.toEntity(dto, department, location, manager);
        return EmployeeMapper.toDTO(employeeService.save(employee));
    }

    @PutMapping("/{id}")
    public EmployeeDTO update(@PathVariable UUID id, @RequestBody EmployeeDTO dto) {
        Department department = departmentService.getById(dto.getDepartmentId());
        Location location = locationService.getById(dto.getLocationId());
        Employee manager = dto.getManagerId() != null ? employeeService.getById(dto.getManagerId()) : null;
        Employee employee = EmployeeMapper.toEntity(dto, department, location, manager);
        employee.setId(id);
        return EmployeeMapper.toDTO(employeeService.save(employee));
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        employeeService.delete(id);
    }
}