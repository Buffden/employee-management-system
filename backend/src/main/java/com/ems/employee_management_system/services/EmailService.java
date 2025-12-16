package com.ems.employee_management_system.services;

public interface EmailService {
    void sendInvite(String toEmail, String inviteLink, String demoToken);
    void sendPasswordReset(String toEmail, String resetLink, String demoToken);
}
