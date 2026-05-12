package com.servicemate.service;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final EmailService emailService;
    private final SimpMessagingTemplate messagingTemplate;

    public void notifyBookingUpdate(String email, Long bookingId, String status) {
        String message = "Your booking #" + bookingId + " has been updated to: " + status;
        emailService.sendNotification(email, "Booking Update - ServiceMate", message);

        // Push real-time notification to the user's specific topic
        messagingTemplate.convertAndSend("/topic/notifications/" + email, message);
    }

    public void notifyPaymentSuccess(String email, String txRef) {
        String message = "Your payment was successful. Transaction Reference: " + txRef;
        emailService.sendNotification(email, "Payment Confirmed - ServiceMate", message);

        // Push real-time notification to the user's specific topic
        messagingTemplate.convertAndSend("/topic/notifications/" + email, message);
    }
    // Add Twilio SMS integration here for mobile notifications
}