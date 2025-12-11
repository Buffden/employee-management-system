package com.ems.employee_management_system.services;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ems.employee_management_system.constants.Constants;
import com.ems.employee_management_system.models.Task;
import com.ems.employee_management_system.repositories.TaskRepository;
import com.ems.employee_management_system.security.SecurityService;

@Service
public class TaskService {
    private static final Logger logger = LoggerFactory.getLogger(TaskService.class);
    
    private final TaskRepository taskRepository;
    private final SecurityService securityService;

    public TaskService(TaskRepository taskRepository,
                       SecurityService securityService) {
        this.taskRepository = taskRepository;
        this.securityService = securityService;
    }

    public Page<Task> getAll(Pageable pageable) {
        logger.debug("Fetching tasks with pagination: page={}, size={}", pageable.getPageNumber(), pageable.getPageSize());
        String role = securityService.getCurrentUserRole();
        UUID departmentId = securityService.getCurrentUserDepartmentId();
        UUID userId = securityService.getCurrentUserEmployeeId();
        return taskRepository.findAllFilteredByRole(role, departmentId, userId, pageable);
    }

    public List<Task> getAll() {
        logger.debug("Fetching all tasks (no pagination)");
        return taskRepository.findAll();
    }

    public Task getById(UUID id) {
        logger.debug("Fetching task with id: {}", id);
        return taskRepository.findById(id).orElse(null);
    }

    /**
     * Saves a task with business logic validation
     * Validates date constraints (dueDate >= startDate, completedDate >= startDate)
     * Validates status transitions
     * Auto-sets completedDate when status changes to "Completed"
     */
    @Transactional
    public Task save(Task task) {
        logger.debug("Saving task: {}", task.getName());
        
        // Get existing task if updating
        Task existingTask = null;
        if (task.getId() != null) {
            existingTask = taskRepository.findById(task.getId()).orElse(null);
        }
        
        // Validate date constraints
        if (task.getStartDate() != null) {
            if (task.getDueDate() != null && task.getDueDate().isBefore(task.getStartDate())) {
                logger.warn("Invalid date range for task: {}", task.getName());
                throw new IllegalArgumentException("Task due date must be >= start date");
            }
            if (task.getCompletedDate() != null && task.getCompletedDate().isBefore(task.getStartDate())) {
                logger.warn("Invalid completed date for task: {}", task.getName());
                throw new IllegalArgumentException("Task completed date must be >= start date");
            }
        }
        
        // Validate status
        if (task.getStatus() != null) {
            String status = task.getStatus();
            List<String> validStatuses = Arrays.asList(Constants.VALID_TASK_STATUSES);
            if (!validStatuses.contains(status)) {
                logger.warn("Invalid task status: {} for task: {}", status, task.getName());
                throw new IllegalArgumentException("Invalid task status: " + status + ". Valid statuses: " + validStatuses);
            }
            
            // Auto-set completedDate when status changes to "Completed"
            if (Constants.TASK_STATUS_COMPLETED.equals(status)) {
                if (task.getCompletedDate() == null) {
                    task.setCompletedDate(LocalDate.now());
                    logger.debug("Auto-set completed date for task: {}", task.getName());
                }
            } else if (existingTask != null && Constants.TASK_STATUS_COMPLETED.equals(existingTask.getStatus()) && !Constants.TASK_STATUS_COMPLETED.equals(status)) {
                // Clear completedDate if status changes from Completed to something else
                task.setCompletedDate(null);
                logger.debug("Cleared completed date for task: {}", task.getName());
            }
        }
        
        // Validate priority
        if (task.getPriority() != null) {
            String priority = task.getPriority();
            List<String> validPriorities = Arrays.asList(Constants.VALID_TASK_PRIORITIES);
            if (!validPriorities.contains(priority)) {
                logger.warn("Invalid task priority: {} for task: {}", priority, task.getName());
                throw new IllegalArgumentException("Invalid task priority: " + priority + ". Valid priorities: " + validPriorities);
            }
        }
        
        Task saved = taskRepository.save(task);
        logger.info("Task saved successfully with id: {}", saved.getId());
        return saved;
    }

    @Transactional
    public void delete(UUID id) {
        logger.info("Deleting task with id: {}", id);
        taskRepository.deleteById(id);
        logger.info("Task deleted successfully with id: {}", id);
    }
} 