package com.ems.employee_management_system.services.impl;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.ems.employee_management_system.services.EmailService;

public class DemoEmailService implements EmailService {

    private static final Logger logger = LoggerFactory.getLogger(DemoEmailService.class);

    @Override
    public void sendInvite(String toEmail, String inviteLink, String demoToken) {
        // Don't log sensitive tokens - only log email and link for debugging
        logger.info("Invite email sent to: {}", toEmail);
        logger.debug("Invite link: {}", inviteLink);
        // Token is not logged for security
    }

    @Override
    public void sendPasswordReset(String toEmail, String resetLink, String demoToken) {
        // Don't log sensitive tokens - only log email and link for debugging
        logger.info("Password reset email sent to: {}", toEmail);
        logger.debug("Reset link: {}", resetLink);
        // Token is not logged for security
    }
}
