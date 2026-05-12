package com.servicemate.repository.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id") // Added for better entity comparison
@Entity
@Table(name = "reviews")
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false, unique = true) // One review per booking
    private Booking booking; // The booking this review is for

    @Column(nullable = false)
    private Integer rating; // Rating from 1 to 5

    @Column(columnDefinition = "TEXT")
    private String comment;
    
    @Column(name = "helpful_count", nullable = false)
    private Integer helpfulCount = 0; // How many users found this review helpful
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReviewStatus status = ReviewStatus.VISIBLE; // VISIBLE, HIDDEN, PENDING_MODERATION

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}