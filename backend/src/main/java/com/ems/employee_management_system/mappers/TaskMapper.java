package com.ems.employee_management_system.mappers;

import com.ems.employee_management_system.dtos.TaskDTO;
import com.ems.employee_management_system.models.Employee;
import com.ems.employee_management_system.models.Project;
import com.ems.employee_management_system.models.Task;

public class TaskMapper {
    public static TaskDTO toDTO(Task task) {
        TaskDTO dto = new TaskDTO();
        dto.setId(task.getId());
        dto.setName(task.getName());
        dto.setDescription(task.getDescription());
        dto.setStatus(task.getStatus());
        dto.setPriority(task.getPriority());
        dto.setStartDate(task.getStartDate());
        dto.setDueDate(task.getDueDate());
        dto.setCompletedDate(task.getCompletedDate());
        dto.setProjectId(task.getProject() != null ? task.getProject().getId() : null);
        dto.setAssignedToId(task.getAssignedTo() != null ? task.getAssignedTo().getId() : null);
        return dto;
    }

    public static Task toEntity(TaskDTO dto, Project project, Employee assignedTo) {
        Task task = new Task();
        task.setId(dto.getId());
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