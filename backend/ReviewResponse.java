package com.servicemate.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor // Added for easier instantiation
public class ReviewResponse {
    private Long id;
    private String customerName;
    private String serviceItemName;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
    private Long bookingId;
    private Long serviceId; // Added for convenience
    private Long providerId; // Added for convenience
    private Integer helpfulCount;
    private String status; // ReviewStatus as String
    private String reportReason; // For admin reports
}