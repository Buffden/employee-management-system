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

import com.ems.employee_management_system.dtos.DepartmentDTO;
import com.ems.employee_management_system.mappers.DepartmentMapper;
import com.ems.employee_management_system.models.Department;
import com.ems.employee_management_system.models.Employee;
import com.ems.employee_management_system.models.Location;
import com.ems.employee_management_system.services.DepartmentService;
import com.ems.employee_management_system.services.EmployeeService;
import com.ems.employee_management_system.services.LocationService;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {
    private final DepartmentService departmentService;
    private final LocationService locationService;
    private final EmployeeService employeeService;

    public DepartmentController(DepartmentService departmentService, LocationService locationService, EmployeeService employeeService) {
        this.departmentService = departmentService;
        this.locationService = locationService;
        this.employeeService = employeeService;
    }

    @GetMapping
    public List<DepartmentDTO> getAll() {
        return departmentService.getAll().stream()
                .map(DepartmentMapper::toDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public DepartmentDTO getById(@PathVariable UUID id) {
        Department department = departmentService.getById(id);
        return department != null ? DepartmentMapper.toDTO(department) : null;
    }

    @PostMapping
    public DepartmentDTO create(@RequestBody DepartmentDTO dto) {
        Location location = locationService.getById(dto.getLocationId());
        Employee head = dto.getDepartmentHeadId() != null ? employeeService.getById(dto.getDepartmentHeadId()) : null;
        Department department = DepartmentMapper.toEntity(dto, location, head);
        return DepartmentMapper.toDTO(departmentService.save(department));
    }

    @PutMapping("/{id}")
    public DepartmentDTO update(@PathVariable UUID id, @RequestBody DepartmentDTO dto) {
        Location location = locationService.getById(dto.getLocationId());
        Employee head = dto.getDepartmentHeadId() != null ? employeeService.getById(dto.getDepartmentHeadId()) : null;
        Department department = DepartmentMapper.toEntity(dto, location, head);
        department.setId(id);
        return DepartmentMapper.toDTO(departmentService.save(department));
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        departmentService.delete(id);
    }
}
