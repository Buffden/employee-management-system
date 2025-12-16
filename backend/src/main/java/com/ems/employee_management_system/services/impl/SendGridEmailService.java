package com.ems.employee_management_system.services.impl;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.ems.employee_management_system.services.EmailService;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * SendGrid email service implementation for sending transactional emails.
 * Uses SendGrid REST API v3 to send emails.
 * 
 * Free tier: 100 emails/day (3,000/month) - perfect for most applications
 */
public class SendGridEmailService implements EmailService {

    private static final Logger logger = LoggerFactory.getLogger(SendGridEmailService.class);
    private static final String SENDGRID_API_URL = "https://api.sendgrid.com/v3/mail/send";
    
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String fromEmail;
    private final String fromName;

    public SendGridEmailService(
            @Value("${email.sendgrid.api-key:}") String apiKey,
            @Value("${email.sendgrid.from-email:}") String fromEmail,
            @Value("${email.sendgrid.from-name:Employee Management System}") String fromName,
            RestTemplate restTemplate,
            ObjectMapper objectMapper) {
        this.apiKey = apiKey;
        this.fromEmail = fromEmail;
        this.fromName = fromName;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public void sendInvite(String toEmail, String inviteLink, String demoToken) {
        String subject = "Welcome to Employee Management System - Set Your Password";
        String htmlContent = buildInviteEmailContent(inviteLink, demoToken);
        String textContent = buildInviteEmailTextContent(inviteLink, demoToken);
        
        sendEmail(toEmail, subject, htmlContent, textContent);
    }

    @Override
    public void sendPasswordReset(String toEmail, String resetLink, String demoToken) {
        String subject = "Password Reset Request - Employee Management System";
        String htmlContent = buildPasswordResetEmailContent(resetLink, demoToken);
        String textContent = buildPasswordResetEmailTextContent(resetLink, demoToken);
        
        sendEmail(toEmail, subject, htmlContent, textContent);
    }

    /**
     * Sends an email via SendGrid API
     */
    private void sendEmail(String toEmail, String subject, String htmlContent, String textContent) {
        if (apiKey == null || apiKey.isEmpty()) {
            logger.warn("SendGrid API key not configured. Email to {} not sent.", toEmail);
            return;
        }

        if (fromEmail == null || fromEmail.isEmpty()) {
            logger.warn("SendGrid from email not configured. Email to {} not sent.", toEmail);
            return;
        }

        try {
            Map<String, Object> requestBody = buildEmailRequest(toEmail, subject, htmlContent, textContent);
            String requestBodyJson = objectMapper.writeValueAsString(requestBody);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            HttpEntity<String> entity = new HttpEntity<>(requestBodyJson, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    SENDGRID_API_URL,
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                logger.info("Email sent successfully to {} via SendGrid", toEmail);
            } else {
                logger.warn("SendGrid returned non-success status: {} for email to {}", 
                           response.getStatusCode(), toEmail);
            }

        } catch (RestClientException e) {
            logger.error("Failed to send email to {} via SendGrid: {}", toEmail, e.getMessage(), e);
        } catch (Exception e) {
            logger.error("Unexpected error sending email to {} via SendGrid: {}", toEmail, e.getMessage(), e);
        }
    }

    /**
     * Builds the SendGrid API request body
     */
    private Map<String, Object> buildEmailRequest(String toEmail, String subject, String htmlContent, String textContent) {
        Map<String, Object> requestBody = new HashMap<>();
        
        // Personalizations (recipients)
        Map<String, Object> personalization = new HashMap<>();
        List<Map<String, String>> toList = new ArrayList<>();
        Map<String, String> toEmailMap = new HashMap<>();
        toEmailMap.put("email", toEmail);
        toList.add(toEmailMap);
        personalization.put("to", toList);
        
        List<Map<String, Object>> personalizationsList = new ArrayList<>();
        personalizationsList.add(personalization);
        requestBody.put("personalizations", personalizationsList);
        
        // From email
        Map<String, String> from = new HashMap<>();
        from.put("email", fromEmail);
        from.put("name", fromName);
        requestBody.put("from", from);
        
        // Subject and content
        requestBody.put("subject", subject);
        
        List<Map<String, String>> contentList = new ArrayList<>();
        Map<String, String> textContentMap = new HashMap<>();
        textContentMap.put("type", "text/plain");
        textContentMap.put("value", textContent);
        contentList.add(textContentMap);
        
        Map<String, String> htmlContentMap = new HashMap<>();
        htmlContentMap.put("type", "text/html");
        htmlContentMap.put("value", htmlContent);
        contentList.add(htmlContentMap);
        
        requestBody.put("content", contentList);
        
        return requestBody;
    }

    private String buildInviteEmailContent(String inviteLink, String demoToken) {
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html>");
        html.append("<html><head><meta charset='UTF-8'></head><body>");
        html.append("<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>");
        html.append("<h2 style='color: #333;'>Welcome to Employee Management System</h2>");
        html.append("<p>You've been invited to join the Employee Management System.</p>");
        html.append("<p>Please click the button below to set your password and activate your account:</p>");
        html.append("<div style='text-align: center; margin: 30px 0;'>");
        html.append("<a href='").append(inviteLink)
            .append("' style='background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;'>Activate Account</a>");
        html.append("</div>");
        html.append("<p style='color: #666; font-size: 14px;'>Or copy and paste this link into your browser:</p>");
        html.append("<p style='color: #666; font-size: 14px; word-break: break-all;'>").append(inviteLink).append("</p>");
        
        if (demoToken != null && !demoToken.isEmpty()) {
            html.append("<div style='background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin-top: 20px; border-radius: 4px;'>");
            html.append("<p style='margin: 0; color: #856404;'><strong>Demo Mode:</strong> Your activation token is:</p>");
            html.append("<p style='margin: 5px 0 0 0; font-family: monospace; color: #856404;'>").append(demoToken).append("</p>");
            html.append("</div>");
        }
        
        html.append("<p style='color: #999; font-size: 12px; margin-top: 30px;'>This link will expire in 24 hours.</p>");
        html.append("</div></body></html>");
        return html.toString();
    }

    private String buildInviteEmailTextContent(String inviteLink, String demoToken) {
        StringBuilder text = new StringBuilder();
        text.append("Welcome to Employee Management System\n\n");
        text.append("You've been invited to join the Employee Management System.\n\n");
        text.append("Please click the link below to set your password and activate your account:\n");
        text.append(inviteLink).append("\n\n");
        
        if (demoToken != null && !demoToken.isEmpty()) {
            text.append("Demo Mode - Your activation token is: ").append(demoToken).append("\n\n");
        }
        
        text.append("This link will expire in 24 hours.\n");
        return text.toString();
    }

    private String buildPasswordResetEmailContent(String resetLink, String demoToken) {
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html>");
        html.append("<html><head><meta charset='UTF-8'></head><body>");
        html.append("<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>");
        html.append("<h2 style='color: #333;'>Password Reset Request</h2>");
        html.append("<p>We received a request to reset your password for your Employee Management System account.</p>");
        html.append("<p>Click the button below to reset your password:</p>");
        html.append("<div style='text-align: center; margin: 30px 0;'>");
        html.append("<a href='").append(resetLink)
            .append("' style='background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;'>Reset Password</a>");
        html.append("</div>");
        html.append("<p style='color: #666; font-size: 14px;'>Or copy and paste this link into your browser:</p>");
        html.append("<p style='color: #666; font-size: 14px; word-break: break-all;'>").append(resetLink).append("</p>");
        
        if (demoToken != null && !demoToken.isEmpty()) {
            html.append("<div style='background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin-top: 20px; border-radius: 4px;'>");
            html.append("<p style='margin: 0; color: #856404;'><strong>Demo Mode:</strong> Your reset token is:</p>");
            html.append("<p style='margin: 5px 0 0 0; font-family: monospace; color: #856404;'>").append(demoToken).append("</p>");
            html.append("</div>");
        }
        
        html.append("<p style='color: #999; font-size: 12px; margin-top: 30px;'>");
        html.append("If you didn't request a password reset, please ignore this email. This link will expire in 24 hours.");
        html.append("</p>");
        html.append("</div></body></html>");
        return html.toString();
    }

    private String buildPasswordResetEmailTextContent(String resetLink, String demoToken) {
        StringBuilder text = new StringBuilder();
        text.append("Password Reset Request\n\n");
        text.append("We received a request to reset your password for your Employee Management System account.\n\n");
        text.append("Please click the link below to reset your password:\n");
        text.append(resetLink).append("\n\n");
        
        if (demoToken != null && !demoToken.isEmpty()) {
            text.append("Demo Mode - Your reset token is: ").append(demoToken).append("\n\n");
        }
        
        text.append("If you didn't request a password reset, please ignore this email.\n");
        text.append("This link will expire in 24 hours.\n");
        return text.toString();
    }
}

