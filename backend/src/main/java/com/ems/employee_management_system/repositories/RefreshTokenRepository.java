package com.ems.employee_management_system.repositories;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ems.employee_management_system.models.RefreshToken;
import com.ems.employee_management_system.models.User;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    Optional<RefreshToken> findByTokenHashAndRevokedAtIsNullAndExpiresAtAfter(
        String tokenHash,
        LocalDateTime now
    );

    long deleteByUser(User user);
}
