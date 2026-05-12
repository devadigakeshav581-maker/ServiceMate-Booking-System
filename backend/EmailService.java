package com.servicemate.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

/**
 * Service for sending emails. 
 * For production, configure Spring Mail (JavaMailSender) or an external API like SendGrid.
 */
@Service
public class EmailService {

    @Value("${app.base-url:http://localhost:8080}")
    private String appBaseUrl;

    public void sendVerificationEmail(String email, String token) {
        String verificationLink = appBaseUrl + "/api/auth/verify-email?token=" + token;
        // In a real application, you would use JavaMailSender here to send an actual email.
        System.out.println("DEBUG: Sending verification email to: " + email);
        System.out.println("DEBUG: Link: " + verificationLink);
    }

    public void sendNotification(String email, String subject, String message) {
        System.out.println("DEBUG: Sending email to " + email + " | Subject: " + subject + " | Body: " + message);
    }
}