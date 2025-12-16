package com.ems.employee_management_system.services;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ems.employee_management_system.enums.UserRole;
import com.ems.employee_management_system.enums.UserStatus;
import com.ems.employee_management_system.models.Employee;
import com.ems.employee_management_system.models.InviteToken;
import com.ems.employee_management_system.models.PasswordResetToken;
import com.ems.employee_management_system.models.User;
import com.ems.employee_management_system.repositories.InviteTokenRepository;
import com.ems.employee_management_system.repositories.PasswordResetTokenRepository;
import com.ems.employee_management_system.repositories.UserRepository;
import com.ems.employee_management_system.utils.HashUtil;

@Service
public class AccountProvisioningService {

    private static final Logger logger = LoggerFactory.getLogger(AccountProvisioningService.class);
    private static final int TOKEN_EXPIRY_HOURS = 24;

    private final UserRepository userRepository;
    private final InviteTokenRepository inviteTokenRepository;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final boolean demoMode;
    private final String frontendBaseUrl;

    public AccountProvisioningService(UserRepository userRepository,
                                      InviteTokenRepository inviteTokenRepository,
                                      PasswordResetTokenRepository resetTokenRepository,
                                      PasswordEncoder passwordEncoder,
                                      EmailService emailService,
                                      @Value("${app.demo-mode:true}") boolean demoMode,
                                      @Value("${app.frontend.base-url:http://localhost:4200}") String frontendBaseUrl) {
        this.userRepository = userRepository;
        this.inviteTokenRepository = inviteTokenRepository;
        this.resetTokenRepository = resetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.demoMode = demoMode;
        this.frontendBaseUrl = frontendBaseUrl;
    }

    /**
    * Provision a user account for an employee (INVITED status, role EMPLOYEE)
    */
    @Transactional
    public String provisionUserForEmployee(Employee employee) {
        logger.info("Provisioning user for employee {}", employee.getEmail());

        // If a user already exists for this email, skip creating another
        Optional<User> existingUser = userRepository.findByEmail(employee.getEmail());
        if (existingUser.isPresent()) {
            logger.warn("User already exists for email {}. Skipping provisioning.", employee.getEmail());
            return createAndReturnInvite(existingUser.get());
        }

        User user = new User();
        user.setUsername(employee.getEmail()); // use email as username for invites
        user.setEmail(employee.getEmail());
        user.setRole(UserRole.EMPLOYEE.getValue());
        user.setStatus(UserStatus.INVITED);
        user.setEmployee(employee);
        user.setPassword(null); // set on activation
        user.setCreatedAt(LocalDateTime.now());

        user = userRepository.save(user);
        return createAndReturnInvite(user);
    }

    /**
    * Activate user using invite token; password is expected to be already SHA-256 hashed by frontend.
    */
    @Transactional
    public void activateAccount(String tokenPlain, String hashedPasswordFromClient) {
        String tokenHash = HashUtil.hashSHA256(tokenPlain);
        InviteToken invite = inviteTokenRepository.findByTokenHashAndExpiresAtAfterAndUsedAtIsNull(tokenHash, LocalDateTime.now())
            .orElseThrow(() -> new IllegalArgumentException("Invalid or expired token"));

        User user = invite.getUser();
        user.setPassword(passwordEncoder.encode(hashedPasswordFromClient));
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);

        invite.setUsedAt(LocalDateTime.now());
        inviteTokenRepository.save(invite);

        // Invalidate other invites for this user
        inviteTokenRepository.deleteByUser(user);

        logger.info("User {} activated successfully", user.getEmail());
    }

    /**
    * Resend invite (generate new token)
    */
    @Transactional
    public String resendInvite(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return createAndReturnInvite(user);
    }

    /**
    * Create forgot password token
    */
    @Transactional
    public String createResetToken(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Invalidate previous reset tokens
        resetTokenRepository.deleteByUser(user);

        String plainToken = generateToken();
        String tokenHash = HashUtil.hashSHA256(plainToken);

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUser(user);
        resetToken.setTokenHash(tokenHash);
        resetToken.setExpiresAt(LocalDateTime.now().plusHours(TOKEN_EXPIRY_HOURS));
        resetTokenRepository.save(resetToken);

        String resetLink = buildResetLink(plainToken);
        emailService.sendPasswordReset(user.getEmail(), resetLink, demoMode ? plainToken : null);

        return plainToken;
    }

    /**
    * Reset password using reset token; password expected to be already SHA-256 hashed by client
    */
    @Transactional
    public void resetPassword(String tokenPlain, String hashedPasswordFromClient) {
        String tokenHash = HashUtil.hashSHA256(tokenPlain);
        PasswordResetToken resetToken = resetTokenRepository.findByTokenHashAndExpiresAtAfterAndUsedAtIsNull(tokenHash, LocalDateTime.now())
            .orElseThrow(() -> new IllegalArgumentException("Invalid or expired token"));

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(hashedPasswordFromClient));
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);

        resetToken.setUsedAt(LocalDateTime.now());
        resetTokenRepository.save(resetToken);

        // Invalidate other reset tokens
        resetTokenRepository.deleteByUser(user);

        logger.info("Password reset successfully for {}", user.getEmail());
    }

    /**
    * Helper: create invite token and optionally send email
    */
    private String createAndReturnInvite(User user) {
        // Invalidate previous invites
        inviteTokenRepository.deleteByUser(user);

        String plainToken = generateToken();
        String tokenHash = HashUtil.hashSHA256(plainToken);

        InviteToken inviteToken = new InviteToken();
        inviteToken.setUser(user);
        inviteToken.setTokenHash(tokenHash);
        inviteToken.setExpiresAt(LocalDateTime.now().plusHours(TOKEN_EXPIRY_HOURS));
        inviteTokenRepository.save(inviteToken);

        String inviteLink = buildInviteLink(plainToken);
        emailService.sendInvite(user.getEmail(), inviteLink, demoMode ? plainToken : null);

        return plainToken;
    }

    private String generateToken() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    private String buildInviteLink(String token) {
        return frontendBaseUrl + "/activate?token=" + token;
    }

    private String buildResetLink(String token) {
        return frontendBaseUrl + "/reset?token=" + token;
    }
}
