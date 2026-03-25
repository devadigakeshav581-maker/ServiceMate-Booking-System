package com.servicemate.dto;

import lombok.Data;
import java.time.Instant;

@Data
public class ChatMessageResponse {
    private Long id;
    private Long bookingId;
    private Long senderId;
    private String senderName;
    private String senderRole;
    private String text;
    private Instant timestamp;
}