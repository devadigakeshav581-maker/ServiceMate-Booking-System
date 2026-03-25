package com.servicemate.config;

import com.servicemate.dto.ActivityDto;
import com.servicemate.repository.UserRepository;
import com.servicemate.repository.model.User;
import com.servicemate.service.RealTimeService;
import java.security.Principal;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
public class WebSocketEventListener {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketEventListener.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RealTimeService realTimeService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate; // Keep for direct count broadcast

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        logger.info("Received a new web socket connection");
        Principal user = event.getUser();
        if (user != null) {
            updateUserStatus(user.getName(), true);
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        logger.info("User disconnected");
        Principal user = event.getUser();
        if (user != null) {
            updateUserStatus(user.getName(), false);
        }
    }

    private void updateUserStatus(String email, boolean isOnline) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setIsOnline(isOnline);
            userRepository.save(user);
            logger.info("Updated online status for user {}: {}", email, isOnline);

            // Broadcast structured activity to admin feed
            String activityType = isOnline ? "USER_ONLINE" : "USER_OFFLINE";
            String message = email + (isOnline ? " came online." : " went offline.");
            realTimeService.broadcastActivity(new ActivityDto(activityType, message));

            // Broadcast updated count to admins
            long count = userRepository.countByIsOnlineTrue();
            messagingTemplate.convertAndSend("/topic/admin/online-users-count", count);
        }
    }
}