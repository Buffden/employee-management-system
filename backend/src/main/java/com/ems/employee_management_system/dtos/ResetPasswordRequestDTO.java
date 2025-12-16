package com.ems.employee_management_system.dtos;

import jakarta.validation.constraints.NotBlank;

public class ResetPasswordRequestDTO {
    @NotBlank
    private String token;

    @NotBlank
    private String password; // already hashed on frontend

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
