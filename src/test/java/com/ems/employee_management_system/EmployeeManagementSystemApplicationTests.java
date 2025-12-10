package com.ems.employee_management_system;

import io.github.cdimascio.dotenv.Dotenv;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
public class EmployeeManagementSystemApplicationTests {
	@Test
	void contextLoads() {
		// Just validate Spring Boot context loads successfully
		assertTrue(true);
	}
}
