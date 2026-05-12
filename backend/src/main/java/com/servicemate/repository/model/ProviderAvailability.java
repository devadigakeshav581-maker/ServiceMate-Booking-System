package com.servicemate.repository.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "provider_availability", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"provider_id", "day_of_week", "start_time"})
})
public class ProviderAvailability {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "provider_id", nullable = false)
    private User provider;

    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false)
    private DayOfWeek dayOfWeek;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @PrePersist
    @PreUpdate
    public void validateTimes() {
        if (startTime.isAfter(endTime)) {
            throw new IllegalArgumentException("Start time cannot be after end time.");
        }
        if (startTime.equals(endTime)) {
            throw new IllegalArgumentException("Start time cannot be equal to end time.");
        }
        // Optional: Add logic to check for overlapping slots for the same provider and day
        // This would typically be done in the service layer or with a custom validator
    }
}