package com.ems.employee_management_system.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.ems.employee_management_system.models.Project;
import com.ems.employee_management_system.repositories.EmployeeProjectRepository;
import com.ems.employee_management_system.repositories.ProjectRepository;
import com.ems.employee_management_system.repositories.TaskRepository;
import com.ems.employee_management_system.security.SecurityService;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private SecurityService securityService;

    @Mock
    private EmployeeProjectRepository employeeProjectRepository;

    @Mock
    private TaskRepository taskRepository;

    @InjectMocks
    private ProjectService projectService;

    private Project testProject;
    private UUID projectId;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        testProject = new Project();
        testProject.setId(projectId);
        testProject.setName("Test Project");
        testProject.setStartDate(LocalDate.now());
        testProject.setEndDate(LocalDate.now().plusDays(30));
        testProject.setStatus("Active");
    }

    @Test
    void testDelete_WithNoRelatedRecords_DeletesProject() {
        // Arrange
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));
        when(employeeProjectRepository.countByProjectId(projectId)).thenReturn(0L);
        when(taskRepository.countByProjectId(projectId)).thenReturn(0L);
        doNothing().when(projectRepository).deleteById(projectId);

        // Act
        projectService.delete(projectId);

        // Assert
        verify(projectRepository).findById(projectId);
        verify(employeeProjectRepository).countByProjectId(projectId);
        verify(taskRepository).countByProjectId(projectId);
        verify(projectRepository).deleteById(projectId);
        verify(employeeProjectRepository, never()).deleteByProjectId(any());
        verify(taskRepository, never()).deleteByProjectId(any());
    }

    @Test
    void testDelete_WithEmployeeAssignments_DeletesAssignmentsThenProject() {
        // Arrange
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));
        when(employeeProjectRepository.countByProjectId(projectId)).thenReturn(3L);
        when(taskRepository.countByProjectId(projectId)).thenReturn(0L);
        doNothing().when(employeeProjectRepository).deleteByProjectId(projectId);
        doNothing().when(projectRepository).deleteById(projectId);

        // Act
        projectService.delete(projectId);

        // Assert
        verify(employeeProjectRepository).deleteByProjectId(projectId);
        verify(taskRepository, never()).deleteByProjectId(any());
        verify(projectRepository).deleteById(projectId);
    }

    @Test
    void testDelete_WithTasks_DeletesTasksThenProject() {
        // Arrange
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));
        when(employeeProjectRepository.countByProjectId(projectId)).thenReturn(0L);
        when(taskRepository.countByProjectId(projectId)).thenReturn(5L);
        doNothing().when(taskRepository).deleteByProjectId(projectId);
        doNothing().when(projectRepository).deleteById(projectId);

        // Act
        projectService.delete(projectId);

        // Assert
        verify(taskRepository).deleteByProjectId(projectId);
        verify(employeeProjectRepository, never()).deleteByProjectId(any());
        verify(projectRepository).deleteById(projectId);
    }

    @Test
    void testDelete_WithBothTasksAndAssignments_DeletesBothThenProject() {
        // Arrange
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));
        when(employeeProjectRepository.countByProjectId(projectId)).thenReturn(2L);
        when(taskRepository.countByProjectId(projectId)).thenReturn(4L);
        doNothing().when(employeeProjectRepository).deleteByProjectId(projectId);
        doNothing().when(taskRepository).deleteByProjectId(projectId);
        doNothing().when(projectRepository).deleteById(projectId);

        // Act
        projectService.delete(projectId);

        // Assert
        verify(employeeProjectRepository).deleteByProjectId(projectId);
        verify(taskRepository).deleteByProjectId(projectId);
        verify(projectRepository).deleteById(projectId);
    }

    @Test
    void testDelete_ProjectNotFound_ThrowsException() {
        // Arrange
        when(projectRepository.findById(projectId)).thenReturn(Optional.empty());

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
            () -> projectService.delete(projectId));
        assertEquals("Project not found with id: " + projectId, exception.getMessage());
        verify(projectRepository, never()).deleteById(any());
    }

    @Test
    void testGetById_ProjectExists_ReturnsProject() {
        // Arrange
        when(projectRepository.findByIdWithRelationships(projectId)).thenReturn(Optional.of(testProject));

        // Act
        Project result = projectService.getById(projectId);

        // Assert
        assertNotNull(result);
        assertEquals(testProject.getId(), result.getId());
        assertEquals(testProject.getName(), result.getName());
    }

    @Test
    void testGetById_ProjectNotFound_ReturnsNull() {
        // Arrange
        when(projectRepository.findByIdWithRelationships(projectId)).thenReturn(Optional.empty());

        // Act
        Project result = projectService.getById(projectId);

        // Assert
        assertNull(result);
    }

    @Test
    void testSave_ValidProject_SavesSuccessfully() {
        // Arrange
        testProject.setId(null); // New project
        when(projectRepository.findByName(testProject.getName())).thenReturn(Optional.empty());
        when(projectRepository.save(testProject)).thenReturn(testProject);

        // Act
        Project result = projectService.save(testProject);

        // Assert
        assertNotNull(result);
        verify(projectRepository).save(testProject);
    }

    @Test
    void testSave_DuplicateName_ThrowsException() {
        // Arrange
        Project existingProject = new Project();
        existingProject.setId(UUID.randomUUID());
        existingProject.setName("Existing Project");
        
        testProject.setId(null);
        testProject.setName("Existing Project");
        when(projectRepository.findByName("Existing Project")).thenReturn(Optional.of(existingProject));

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
            () -> projectService.save(testProject));
        assertTrue(exception.getMessage().contains("already exists"));
        verify(projectRepository, never()).save(any());
    }

    @Test
    void testSave_InvalidDateRange_ThrowsException() {
        // Arrange
        testProject.setId(null);
        testProject.setStartDate(LocalDate.now());
        testProject.setEndDate(LocalDate.now().minusDays(1)); // End before start
        when(projectRepository.findByName(testProject.getName())).thenReturn(Optional.empty());

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
            () -> projectService.save(testProject));
        assertTrue(exception.getMessage().contains("end date must be >= start date"));
        verify(projectRepository, never()).save(any());
    }

    @Test
    void testGetAll_WithPagination_ReturnsPage() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Page<Project> expectedPage = new PageImpl<>(List.of(testProject), pageable, 1);
        when(securityService.getCurrentUserRole()).thenReturn("SYSTEM_ADMIN");
        when(securityService.getCurrentUserDepartmentId()).thenReturn(null);
        when(securityService.getCurrentUserEmployeeId()).thenReturn(null);
        // SYSTEM_ADMIN role now uses findAllWithRelationships() to eagerly load relationships
        when(projectRepository.findAllWithRelationships(pageable))
            .thenReturn(expectedPage);

        // Act
        Page<Project> result = projectService.getAll(pageable);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
    }
}
