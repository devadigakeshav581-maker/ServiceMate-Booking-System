package com.servicemate.controller;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;

@Controller
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;

    public ChatController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/chat/{bookingId}/typing")
    public void handleTyping(@DestinationVariable String bookingId, @Payload Map<String, Boolean> payload, Principal principal) {
        boolean isTyping = payload.getOrDefault("isTyping", false);
        
        // Broadcast the typing status to the booking-specific topic
        // The sender's username is automatically excluded by STOMP if sent to a user-specific queue, but for topics, all subscribers get it.
        messagingTemplate.convertAndSend("/topic/chat/" + bookingId + "/typing", Map.of("isTyping", isTyping, "sender", principal.getName()));
    }
}