package com.servicemate.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.servicemate.repository.model.Review;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    // Find a review by its booking ID to check for duplicates.
    Optional<Review> findByBooking_Id(Long bookingId);

    // Find all reviews for a given service ID by joining through the booking.
    List<Review> findByBooking_ServiceId(Long serviceId);

    // Calculate average rating for each service
    @Query("SELECT r.booking.serviceId, AVG(r.rating) FROM Review r GROUP BY r.booking.serviceId")
    List<Object[]> findAverageRatings();
}