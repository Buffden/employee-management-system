package com.ems.employee_management_system.mappers;

import com.ems.employee_management_system.dtos.TaskRequestDTO;
import com.ems.employee_management_system.dtos.TaskResponseDTO;
import com.ems.employee_management_system.models.Employee;
import com.ems.employee_management_system.models.Project;
import com.ems.employee_management_system.models.Task;

public class TaskMapper {
    /**
     * Converts Task entity to TaskResponseDTO
     * Includes denormalized names for better API responses
     */
    public static TaskResponseDTO toResponseDTO(Task task) {
        if (task == null) {
            return null;
        }
        
        TaskResponseDTO dto = new TaskResponseDTO();
        dto.setId(task.getId());
        dto.setName(task.getName());
        dto.setDescription(task.getDescription());
        dto.setStatus(task.getStatus());
        dto.setPriority(task.getPriority());
        dto.setStartDate(task.getStartDate());
        dto.setDueDate(task.getDueDate());
        dto.setCompletedDate(task.getCompletedDate());
        
        // Include IDs for form binding and filtering
        dto.setProjectId(task.getProject() != null ? task.getProject().getId() : null);
        dto.setAssignedToId(task.getAssignedTo() != null ? task.getAssignedTo().getId() : null);
        
        // Denormalized names for better API responses
        dto.setProjectName(task.getProject() != null ? task.getProject().getName() : null);
        if (task.getAssignedTo() != null) {
            String assignedToFullName = task.getAssignedTo().getFirstName() + " " + task.getAssignedTo().getLastName();
            dto.setAssignedToName(assignedToFullName);
        } else {
            dto.setAssignedToName(null);
        }
        
        return dto;
    }

    /**
     * Converts TaskRequestDTO to Task entity
     * Relationships are resolved by IDs in the controller layer
     */
    public static Task toEntity(TaskRequestDTO dto, Project project, Employee assignedTo) {
        if (dto == null) {
            return null;
        }
        
        Task task = new Task();
        task.setName(dto.getName());
        task.setDescription(dto.getDescription());
        task.setStatus(dto.getStatus());
        task.setPriority(dto.getPriority());
        task.setStartDate(dto.getStartDate());
        task.setDueDate(dto.getDueDate());
        task.setCompletedDate(dto.getCompletedDate());
        task.setProject(project);
        task.setAssignedTo(assignedTo);
        return task;
    }
} 