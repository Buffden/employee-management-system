package com.ems.employee_management_system.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.ems.employee_management_system.models.Department;
import com.ems.employee_management_system.models.Employee;
import com.ems.employee_management_system.repositories.DepartmentRepository;
import com.ems.employee_management_system.security.SecurityService;

@ExtendWith(MockitoExtension.class)
class DepartmentServiceTest {

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private SecurityService securityService;

    @Mock
    private EmployeeService employeeService;

    @InjectMocks
    private DepartmentService departmentService;

    private Department testDepartment;
    private UUID departmentId;
    private Employee testEmployee;

    @BeforeEach
    void setUp() {
        departmentId = UUID.randomUUID();
        UUID employeeId = UUID.randomUUID();
        
        testDepartment = new Department();
        testDepartment.setId(departmentId);
        testDepartment.setName("Engineering");
        testDepartment.setCreatedAt(LocalDate.now());
        
        testEmployee = new Employee();
        testEmployee.setId(employeeId);
        testEmployee.setFirstName("John");
        testEmployee.setLastName("Doe");
    }

    @Test
    void testDelete_NoEmployees_DeletesSuccessfully() {
        // Arrange
        when(departmentRepository.findById(departmentId)).thenReturn(Optional.of(testDepartment));
        when(departmentRepository.countEmployeesByDepartment(departmentId)).thenReturn(0L);
        doNothing().when(departmentRepository).deleteById(departmentId);

        // Act
        departmentService.delete(departmentId);

        // Assert
        verify(departmentRepository).findById(departmentId);
        verify(departmentRepository).countEmployeesByDepartment(departmentId);
        verify(departmentRepository).deleteById(departmentId);
    }

    @Test
    void testDelete_WithEmployees_ThrowsException() {
        // Arrange
        when(departmentRepository.findById(departmentId)).thenReturn(Optional.of(testDepartment));
        when(departmentRepository.countEmployeesByDepartment(departmentId)).thenReturn(5L);

        // Act & Assert
        IllegalStateException exception = assertThrows(IllegalStateException.class,
            () -> departmentService.delete(departmentId));
        assertTrue(exception.getMessage().contains("Cannot delete department"));
        assertTrue(exception.getMessage().contains("employee"));
        verify(departmentRepository, never()).deleteById(any());
    }

    @Test
    void testDelete_DepartmentNotFound_ThrowsException() {
        // Arrange
        when(departmentRepository.findById(departmentId)).thenReturn(Optional.empty());

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
            () -> departmentService.delete(departmentId));
        assertEquals("Department not found with id: " + departmentId, exception.getMessage());
        verify(departmentRepository, never()).deleteById(any());
    }

    @Test
    void testSearchDepartments_WithSearchTerm_ReturnsFilteredResults() {
        // Arrange
        List<Department> expectedResults = List.of(testDepartment);
        String searchTerm = "Engineering";
        when(departmentRepository.searchDepartments(searchTerm, null, null))
            .thenReturn(expectedResults);

        // Act
        List<Department> result = departmentService.searchDepartments(searchTerm, null, null);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(testDepartment.getName(), result.get(0).getName());
    }

    @Test
    void testSearchDepartments_EmptySearchTerm_TrimsAndPassesNull() {
        // Arrange
        List<Department> expectedResults = new ArrayList<>();
        when(departmentRepository.searchDepartments(null, null, null))
            .thenReturn(expectedResults);

        // Act
        List<Department> result = departmentService.searchDepartments("   ", null, null);

        // Assert
        assertNotNull(result);
        verify(departmentRepository).searchDepartments(null, null, null);
    }

    @Test
    void testSearchDepartments_WithLocationFilter_ReturnsFilteredResults() {
        // Arrange
        UUID locationId = UUID.randomUUID();
        List<Department> expectedResults = List.of(testDepartment);
        when(departmentRepository.searchDepartments(null, locationId, null))
            .thenReturn(expectedResults);

        // Act
        List<Department> result = departmentService.searchDepartments(null, locationId, null);

        // Assert
        assertNotNull(result);
        verify(departmentRepository).searchDepartments(null, locationId, null);
    }

    @Test
    void testSave_WithDepartmentHead_SyncsEmployeeDepartment() {
        // Arrange
        testDepartment.setHead(testEmployee);
        testEmployee.setDepartment(null); // Employee not yet in department
        
        Department savedDepartment = new Department();
        savedDepartment.setId(departmentId);
        savedDepartment.setName("Engineering");
        savedDepartment.setHead(testEmployee);
        
        when(departmentRepository.findByName(testDepartment.getName())).thenReturn(Optional.empty());
        when(departmentRepository.findDepartmentsByHeadId(testEmployee.getId())).thenReturn(new ArrayList<>());
        when(departmentRepository.save(testDepartment)).thenReturn(savedDepartment);
        when(employeeService.getById(testEmployee.getId())).thenReturn(testEmployee);
        when(employeeService.save(testEmployee)).thenReturn(testEmployee);

        // Act
        Department result = departmentService.save(testDepartment);

        // Assert
        assertNotNull(result);
        verify(employeeService).getById(testEmployee.getId());
        verify(employeeService).save(testEmployee);
        verify(departmentRepository).save(testDepartment);
    }

    @Test
    void testSave_DuplicateName_ThrowsException() {
        // Arrange
        Department existingDepartment = new Department();
        existingDepartment.setId(UUID.randomUUID());
        existingDepartment.setName("Existing Department");
        
        testDepartment.setId(null);
        testDepartment.setName("Existing Department");
        when(departmentRepository.findByName("Existing Department"))
            .thenReturn(Optional.of(existingDepartment));

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
            () -> departmentService.save(testDepartment));
        assertTrue(exception.getMessage().contains("already exists"));
        verify(departmentRepository, never()).save(any());
    }

    @Test
    void testSave_EmployeeAlreadyHeadOfAnotherDept_ThrowsException() {
        // Arrange
        Department otherDepartment = new Department();
        otherDepartment.setId(UUID.randomUUID());
        otherDepartment.setName("Other Department");
        
        testDepartment.setId(null);
        testDepartment.setHead(testEmployee);
        when(departmentRepository.findByName(testDepartment.getName())).thenReturn(Optional.empty());
        when(departmentRepository.findDepartmentsByHeadId(testEmployee.getId()))
            .thenReturn(List.of(otherDepartment));

        // Act & Assert
        IllegalStateException exception = assertThrows(IllegalStateException.class,
            () -> departmentService.save(testDepartment));
        assertTrue(exception.getMessage().contains("already head of department"));
        verify(departmentRepository, never()).save(any());
    }
}
