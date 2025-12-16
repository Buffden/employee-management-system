package com.ems.employee_management_system.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import com.ems.employee_management_system.services.EmailService;
import com.ems.employee_management_system.services.impl.DemoEmailService;
import com.ems.employee_management_system.services.impl.SendGridEmailService;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Configuration for email services.
 * Conditionally selects between SendGrid (production) and DemoEmailService (development/demo mode)
 * based on configuration.
 */
@Configuration
public class EmailConfig {

    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000); // 5 seconds
        factory.setReadTimeout(10000); // 10 seconds
        return new RestTemplate(factory);
    }

    /**
     * Primary email service bean.
     * Uses SendGrid if API key is configured, otherwise falls back to DemoEmailService.
     * Uses Spring Boot's auto-configured ObjectMapper for JSON serialization.
     */
    @Bean
    @Primary
    public EmailService emailService(
            @Value("${email.sendgrid.api-key:}") String sendgridApiKey,
            @Value("${email.sendgrid.from-email:}") String sendgridFromEmail,
            @Value("${email.sendgrid.from-name:Employee Management System}") String sendgridFromName,
            @Value("${email.service.provider:sendgrid}") String emailProvider,
            RestTemplate restTemplate,
            ObjectMapper objectMapper) {
        
        // Use SendGrid if API key is provided and provider is set to sendgrid
        if ("sendgrid".equalsIgnoreCase(emailProvider) && 
            sendgridApiKey != null && !sendgridApiKey.isEmpty() &&
            sendgridFromEmail != null && !sendgridFromEmail.isEmpty()) {
            return new SendGridEmailService(sendgridApiKey, sendgridFromEmail, 
                                           sendgridFromName, 
                                           restTemplate, objectMapper);
        }
        
        // Fall back to demo service
        return new DemoEmailService();
    }
}

