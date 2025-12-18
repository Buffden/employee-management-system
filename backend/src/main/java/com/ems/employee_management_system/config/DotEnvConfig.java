package com.ems.employee_management_system.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;

/**
 * Configuration class to load .env file
 * This makes environment variables from .env file available to Spring Boot
 */
@Configuration
public class DotEnvConfig {
    
    @PostConstruct
    public void loadEnv() {
        // Load .env file from db/ directory (used by both Docker and local development)
        // Docker Compose passes these as environment variables, but for local dev we load from file
        Dotenv dotenv = null;
        
        try {
            // Try db directory (relative to backend directory)
            dotenv = Dotenv.configure()
                    .directory("../db")
                    .ignoreIfMissing() // Don't fail if .env doesn't exist (Docker sets env vars directly)
                    .load();
        } catch (Exception e) {
            // Ignore - will use environment variables if already set (e.g., by Docker)
        }
        
        // Set system properties so Spring Boot can access them via ${VAR_NAME}
        // Only set if not already set as environment variable (Docker sets these)
        if (dotenv != null) {
            dotenv.entries().forEach(entry -> {
                // Only set if not already in system properties or environment variables
                // Environment variables take precedence (Docker sets these)
                if (System.getProperty(entry.getKey()) == null && System.getenv(entry.getKey()) == null) {
                    System.setProperty(entry.getKey(), entry.getValue());
                }
            });
        }
    }
}

