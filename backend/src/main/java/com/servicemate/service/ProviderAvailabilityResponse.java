package com.servicemate.service;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ProviderAvailabilityResponse {
    private Long id;
    private Long providerId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status; // e.g., "AVAILABLE", "BLOCKED"
}