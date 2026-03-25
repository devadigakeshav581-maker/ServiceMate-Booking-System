package com.servicemate.service;

import com.servicemate.dto.ActivityDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class RealTimeService {

    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public RealTimeService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    // Use this to broadcast updates to a specific booking (e.g. status change)
    // Clients should subscribe to: /topic/bookings/{bookingId}
    public void sendBookingUpdate(String bookingId, String status) {
        messagingTemplate.convertAndSend("/topic/bookings/" + bookingId, status);
    }

    // Use this to notify a specific user
    // Clients should subscribe to: /user/queue/notifications
    public void notifyUser(String username, Object payload) {
        messagingTemplate.convertAndSendToUser(username, "/queue/notifications", payload);
    }

    // Use this to broadcast structured activity to the admin dashboard feed
    // Admins should subscribe to: /topic/admin/activity-feed
    public void broadcastActivity(ActivityDto activity) {
        messagingTemplate.convertAndSend("/topic/admin/activity-feed", activity);
    }
}