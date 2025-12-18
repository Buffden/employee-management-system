package com.ems.employee_management_system;

import io.github.cdimascio.dotenv.Dotenv;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
public class EmployeeManagementSystemApplicationTests {
	
	static {
		// Load .env.test file from db/ directory (relative to backend directory)
		// This must happen before Spring Boot context loads
		try {
			Dotenv dotenv = Dotenv.configure()
					.directory("../db")
					.filename(".env.test")
					.ignoreIfMissing() // Don't fail if .env.test doesn't exist
					.load();

			// Set system properties from .env.test file
			// Only set if not already set as environment variable or system property
			dotenv.entries().forEach(entry -> {
				if (System.getProperty(entry.getKey()) == null && System.getenv(entry.getKey()) == null) {
					System.setProperty(entry.getKey(), entry.getValue());
				}
			});
		} catch (Exception e) {
			// Ignore - will use fallback defaults below
		}
		
		// Set fallback defaults if not set from .env.test or environment
		// These are read by SecurityConfig and other components
		if (System.getenv("CORS_ALLOWED_ORIGINS") == null && System.getProperty("CORS_ALLOWED_ORIGINS") == null) {
			System.setProperty("CORS_ALLOWED_ORIGINS", "http://localhost");
		}
		if (System.getenv("FRONTEND_BASE_URL") == null && System.getProperty("FRONTEND_BASE_URL") == null) {
			System.setProperty("FRONTEND_BASE_URL", "http://localhost");
		}
		if (System.getenv("JWT_SECRET_KEY") == null && System.getProperty("JWT_SECRET_KEY") == null) {
			System.setProperty("JWT_SECRET_KEY", "test-secret-key-for-jwt-token-signing-in-tests-only-not-for-production-use-at-least-64-bytes-long");
		}
	}
	
	@Test
	void contextLoads() {
		// Just validate Spring Boot context loads successfully
		assertTrue(true);
	}
}
