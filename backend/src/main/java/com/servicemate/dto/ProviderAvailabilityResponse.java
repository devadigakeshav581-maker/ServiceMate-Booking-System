package com.servicemate.dto;

import com.servicemate.repository.model.DayOfWeek;
import lombok.Data;

import java.time.LocalTime;

@Data
public class ProviderAvailabilityResponse {
    private Long id;
    private Long providerId;
    private String providerName;
    private DayOfWeek dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;

    public String getFormattedTimeSlot() {
        return startTime.toString() + " - " + endTime.toString();
    }
}