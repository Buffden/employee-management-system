package com.ems.employee_management_system.config;

import java.util.Arrays;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.boot.context.event.ApplicationReadyEvent;

@Component
public class StartupSecurityLogger {
    private static final Logger logger = LoggerFactory.getLogger(StartupSecurityLogger.class);

    private final Environment environment;

    @Value("${app.demo-mode:false}")
    private boolean demoMode;

    @Value("${app.cookies.secure:true}")
    private boolean cookiesSecure;

    @Value("${app.cookies.same-site:Strict}")
    private String cookiesSameSite;

    @Value("${app.auth.suppress-tokens-for-browser:false}")
    private boolean suppressTokensForBrowser;

    public StartupSecurityLogger(Environment environment) {
        this.environment = environment;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void logSecurityConfig() {
        String[] profiles = environment.getActiveProfiles();
        logger.info("Active profiles: {}", profiles.length == 0 ? "(default)" : Arrays.toString(profiles));
        logger.info("Security flags - demoMode={}, cookiesSecure={}, cookiesSameSite={}, suppressTokensForBrowser={}",
            demoMode, cookiesSecure, cookiesSameSite, suppressTokensForBrowser);
    }
}
