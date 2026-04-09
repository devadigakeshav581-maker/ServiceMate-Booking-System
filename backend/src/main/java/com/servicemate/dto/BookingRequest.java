package com.servicemate.dto;

import lombok.Data;

@Data
public class BookingRequest {
    private Long customerId;
    private Long serviceId;
    private String address;
    private String notes;
    private String bookingDate;
}
