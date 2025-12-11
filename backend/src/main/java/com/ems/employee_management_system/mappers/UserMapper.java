package com.ems.employee_management_system.mappers;

import org.springframework.stereotype.Component;

import com.ems.employee_management_system.dtos.UserDTO;
import com.ems.employee_management_system.models.User;

@Component
public class UserMapper {
    
    public UserDTO toDTO(User user) {
        if (user == null) {
            return null;
        }
        
        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .employeeId(user.getEmployee() != null ? user.getEmployee().getId() : null)
                .createdAt(user.getCreatedAt())
                .lastLogin(user.getLastLogin())
                .build();
    }
}

