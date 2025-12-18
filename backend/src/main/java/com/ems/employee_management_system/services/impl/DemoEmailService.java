package com.ems.employee_management_system.services.impl;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.ems.employee_management_system.services.EmailService;

public class DemoEmailService implements EmailService {

    private static final Logger logger = LoggerFactory.getLogger(DemoEmailService.class);

    @Override
    public void sendInvite(String toEmail, String inviteLink, String demoToken) {
        logger.info("Invite email to {} -> link: {}, token: {}", toEmail, inviteLink, demoToken);
    }

    @Override
    public void sendPasswordReset(String toEmail, String resetLink, String demoToken) {
        logger.info("Password reset email to {} -> link: {}, token: {}", toEmail, resetLink, demoToken);
    }
}
