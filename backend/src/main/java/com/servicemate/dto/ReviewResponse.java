package com.servicemate.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ReviewResponse {
    private Long id;
    private Integer rating;
    private String comment;
    private String customerName;
    private LocalDateTime createdAt;
    private Long bookingId;
}