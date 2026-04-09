package com.servicemate.dto;

import java.time.Instant;

public class ActivityDto {
    private String type;
    private String message;
    private Instant timestamp;

    public ActivityDto() {
        this.timestamp = Instant.now();
    }

    public ActivityDto(String type, String message) {
        this();
        this.type = type;
        this.message = message;
    }

    // Getters and setters are required for JSON serialization
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
}