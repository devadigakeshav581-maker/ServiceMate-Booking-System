package com.servicemate.repository.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long customerId;

    private Long serviceId;

    @Enumerated(EnumType.STRING)
    private BookingStatus status; // PENDING, CONFIRMED, COMPLETED, CANCELLED

    private String address;

    private String notes;

    private LocalDateTime bookingDate;

    private LocalDateTime confirmedAt;

    private LocalDateTime completedAt;

    private LocalDateTime cancelledAt;
}
