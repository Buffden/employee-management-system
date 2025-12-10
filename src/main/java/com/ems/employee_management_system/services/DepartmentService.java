package com.ems.employee_management_system.services;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.ems.employee_management_system.models.Department;
import com.ems.employee_management_system.repositories.DepartmentRepository;

@Service
public class DepartmentService {
    private final DepartmentRepository departmentRepository;

    public DepartmentService(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    public List<Department> getAll() {
        return departmentRepository.findAll();
    }

    public Department getById(UUID id) {
        return departmentRepository.findById(id).orElse(null);
    }

    public Department save(Department department) {
        return departmentRepository.save(department);
    }

    public void delete(UUID id) {
        departmentRepository.deleteById(id);
    }
} 