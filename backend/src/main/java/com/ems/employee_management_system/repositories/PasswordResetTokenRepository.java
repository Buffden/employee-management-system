package com.ems.employee_management_system.repositories;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ems.employee_management_system.models.PasswordResetToken;
import com.ems.employee_management_system.models.User;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {
    Optional<PasswordResetToken> findTopByUserAndUsedAtIsNullOrderByCreatedAtDesc(User user);
    void deleteByUser(User user);
    Optional<PasswordResetToken> findByTokenHashAndExpiresAtAfterAndUsedAtIsNull(String tokenHash, LocalDateTime now);
}
