package com.ems.employee_management_system.services;

import com.ems.employee_management_system.models.EmployeeProject;
import com.ems.employee_management_system.models.EmployeeProject.EmployeeProjectId;
import com.ems.employee_management_system.repositories.EmployeeProjectRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmployeeProjectService {
    private final EmployeeProjectRepository employeeProjectRepository;

    public EmployeeProjectService(EmployeeProjectRepository employeeProjectRepository) {
        this.employeeProjectRepository = employeeProjectRepository;
    }

    public List<EmployeeProject> getAll() {
        return employeeProjectRepository.findAll();
    }

    public EmployeeProject getById(EmployeeProjectId id) {
        return employeeProjectRepository.findById(id).orElse(null);
    }

    public EmployeeProject save(EmployeeProject employeeProject) {
        return employeeProjectRepository.save(employeeProject);
    }

    public void delete(EmployeeProjectId id) {
        employeeProjectRepository.deleteById(id);
    }
} 