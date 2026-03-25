package com.servicemate.dto;

import lombok.Data;

@Data
public class ChatMessageRequest {
    private String text;
    private String senderRole;
}