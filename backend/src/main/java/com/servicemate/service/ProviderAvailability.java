package com.servicemate.service;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "provider_availability")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProviderAvailability {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long providerId; // Links to User entity's ID

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    private AvailabilityStatus status; // e.g., AVAILABLE, BOOKED, BLOCKED

    public enum AvailabilityStatus {
        AVAILABLE,
        BOOKED,
        BLOCKED
    }
}