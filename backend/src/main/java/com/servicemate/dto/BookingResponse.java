package com.servicemate.dto;

import com.servicemate.repository.model.BookingStatus;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class BookingResponse {
    private Long id;
    private Long customerId;
    private Long serviceId;
    private String serviceName;
    private BookingStatus status;
    private String address;
    private String notes;
    private LocalDateTime bookingDate;
    private LocalDateTime confirmedAt;
    private LocalDateTime completedAt;
    private LocalDateTime cancelledAt;
}