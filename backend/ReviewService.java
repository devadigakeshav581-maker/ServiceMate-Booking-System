package com.servicemate.service;

import com.servicemate.dto.ReviewRequest;
import com.servicemate.dto.ReviewResponse;
import com.servicemate.repository.BookingRepository;
import com.servicemate.repository.ReviewReportRepository;
import com.servicemate.repository.ReviewRepository;
import com.servicemate.repository.ReviewVoteRepository;
import com.servicemate.repository.UserRepository;
import com.servicemate.repository.model.Booking;
import com.servicemate.repository.model.BookingStatus;
import com.servicemate.repository.ReviewRepository;
import com.servicemate.repository.ServiceRepository;
import com.servicemate.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor // Use Lombok's @RequiredArgsConstructor for constructor injection
@Transactional // All methods are transactional by default, can be overridden
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private ServiceRepository serviceRepository; // Assuming ServiceRepository exists

    @Autowired
    private UserRepository userRepository; // Assuming UserRepository exists

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final ReviewVoteRepository reviewVoteRepository; // Assuming this exists
    private final ReviewReportRepository reviewReportRepository; // Assuming this exists
    private final ServiceRepository serviceRepository; // Assuming this exists

    public ReviewResponse createReview(ReviewRequest reviewRequest, String customerEmail) {
        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new SecurityException("User not found with email: " + customerEmail));

        Booking booking = bookingRepository.findById(reviewRequest.getBookingId())
                .orElseThrow(() -> new IllegalArgumentException("Booking not found with ID: " + reviewRequest.getBookingId()));

        // --- Business Logic Validations ---
        // 1. Ensure the booking belongs to the customer making the review.
        if (!booking.getCustomerId().equals(customer.getId())) {
            throw new SecurityException("You are not authorized to review this booking.");
        }
        // 2. Ensure the booking has been completed.
        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new IllegalStateException("You can only review bookings that are completed.");
        }
        // 3. Ensure a review for this booking doesn't already exist.
        reviewRepository.findByBooking_Id(booking.getId()).ifPresent(r -> {
            throw new IllegalStateException("A review for this booking already exists.");
        });

        // Create the review
        Review review = new Review();
        review.setBooking(booking);
        review.setRating(reviewRequest.getRating());
        review.setComment(reviewRequest.getComment());
        // Status defaults to VISIBLE, helpfulCount to 0

        // Save the review
        Review savedReview = reviewRepository.save(review);

        // Update service item's average rating and total reviews (if ServiceItem has these fields)
        // This part needs to be carefully integrated with ServiceItem if it has averageRating/totalReviews
        // For now, let's assume ServiceItem has these fields and update them.
        // This logic should ideally be in a separate method or triggered by an event.
        updateServiceItemAverageRating(booking.getServiceId());

        return mapToResponse(savedReview);
    }

    public List<ReviewResponse> getReviewsForService(Long serviceId, String sort) {
        List<Review> reviews = reviewRepository.findByBooking_ServiceId(serviceId).stream()
                .filter(review -> review.getStatus() == ReviewStatus.VISIBLE) // Only show visible reviews
                .collect(Collectors.toList());

        // Sorting logic
        String[] sortParams = sort.split(",");
        String property = sortParams[0];
        String direction = sortParams.length > 1 ? sortParams[1] : "desc";

        Comparator<Review> comparator;

        switch (property) {
            case "rating":
                comparator = Comparator.comparing(Review::getRating);
                break;
            case "helpful":
                comparator = Comparator.comparing(Review::getHelpfulCount, Comparator.nullsLast(Integer::compareTo));
                break;
            default: // Default to sorting by creation date
                comparator = Comparator.comparing(Review::getCreatedAt);
                break;
        }

        if ("desc".equalsIgnoreCase(direction)) {
            comparator = comparator.reversed();
        }

        return reviews.stream().sorted(comparator).map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<Long, Double> getAverageRatings() {
        List<Object[]> results = reviewRepository.findAverageRatings();
        return results.stream().collect(Collectors.toMap(
                row -> (Long) row[0],
                row -> (Double) row[1]
        ));
    }

    public int markHelpful(Long reviewId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new SecurityException("User not found"));

        if (reviewVoteRepository.existsByReviewIdAndUserId(reviewId, user.getId())) {
            throw new IllegalStateException("You have already voted on this review.");
        }

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found with ID: " + reviewId));

        review.setHelpfulCount(review.getHelpfulCount() + 1);
        reviewRepository.save(review);

        ReviewVote vote = new ReviewVote();
        vote.setReview(review);
        vote.setUser(user);
        reviewVoteRepository.save(vote);

        return review.getHelpfulCount();
    }

    public void reportReview(Long reviewId, String reason) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found with ID: " + reviewId));

        ReviewReport report = new ReviewReport();
        report.setReview(review);
        report.setReason(reason);
        reviewReportRepository.save(report);

        // If report count exceeds a threshold, hide the review
        if (reviewReportRepository.countByReviewId(reviewId) >= 5) { // Example threshold
            review.setStatus(ReviewStatus.HIDDEN);
            reviewRepository.save(review);
        }
    }

    // --- Admin Moderation Methods ---

    @Transactional(readOnly = true)
    public List<ReviewReport> getAllReports() {
        return reviewReportRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getReportedReviews() {
        List<Review> reviews = reviewRepository.findAll().stream()
                .filter(review -> review.getStatus() == ReviewStatus.HIDDEN || review.getStatus() == ReviewStatus.PENDING_MODERATION)
                .collect(Collectors.toList());
        return reviews.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public void deleteReviewAsAdmin(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found with ID: " + reviewId));
        // Delete associated reports and votes first to avoid foreign key constraints
        reviewReportRepository.deleteByReviewId(reviewId);
        reviewVoteRepository.deleteByReviewId(reviewId);
        reviewRepository.delete(review);
        updateServiceItemAverageRating(review.getBooking().getServiceId()); // Recalculate average
    }

    public void dismissReports(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found with ID: " + reviewId));
        reviewReportRepository.deleteByReviewId(reviewId);
        // If review was hidden, set it back to visible
        if (review.getStatus() == ReviewStatus.HIDDEN || review.getStatus() == ReviewStatus.PENDING_MODERATION) {
            review.setStatus(ReviewStatus.VISIBLE);
            reviewRepository.save(review);
        }
    }

    public void approveReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found with ID: " + reviewId));
        review.setStatus(ReviewStatus.VISIBLE);
        reviewRepository.save(review);
        reviewReportRepository.deleteByReviewId(reviewId); // Clear any reports
    }

    // Helper method to update average rating for a service item
    private void updateServiceItemAverageRating(Long serviceId) {
        List<Review> reviews = reviewRepository.findByBooking_ServiceId(serviceId).stream()
                .filter(review -> review.getStatus() == ReviewStatus.VISIBLE)
                .collect(Collectors.toList());
        double averageRating = reviews.stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);
        
        serviceRepository.findById(serviceId).ifPresent(serviceItem -> {
            serviceItem.setAverageRating(averageRating);
            serviceItem.setTotalReviews(reviews.size());
            serviceRepository.save(serviceItem);
        });
    }

    private ReviewResponse mapToResponse(Review review) {
        ReviewResponse response = new ReviewResponse();
        response.setId(review.getId());
        response.setRating(review.getRating());
        response.setComment(review.getComment());
        response.setCreatedAt(review.getCreatedAt());
        response.setBookingId(review.getBooking().getId());
        response.setServiceId(review.getBooking().getServiceId());
        response.setProviderId(review.getBooking().getProviderId());
        response.setHelpfulCount(review.getHelpfulCount());
        response.setStatus(review.getStatus().name());

        // Fetch customer name
        userRepository.findById(review.getBooking().getCustomerId()).ifPresent(user -> {
            response.setCustomerName(user.getName());
        });
        // Fetch service item name
        serviceRepository.findById(review.getBooking().getServiceId()).ifPresent(serviceItem -> {
            response.setServiceItemName(serviceItem.getName());
        });

        // If there are reports, fetch the latest reason for admin view
        reviewReportRepository.findTopByReviewIdOrderByReportDateDesc(review.getId())
                .ifPresent(report -> response.setReportReason(report.getReason()));

        return response;
    }
}