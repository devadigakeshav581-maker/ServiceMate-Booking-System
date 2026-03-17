package com.servicemate.service;

import com.servicemate.dto.ReviewRequest;
import com.servicemate.dto.ReviewResponse;
import com.servicemate.repository.BookingRepository;
import com.servicemate.repository.ReviewRepository;
import com.servicemate.repository.ReviewReportRepository;
import com.servicemate.repository.ReviewVoteRepository;
import com.servicemate.repository.UserRepository;
import com.servicemate.repository.model.Booking;
import com.servicemate.repository.model.BookingStatus;
import com.servicemate.repository.model.Review;
import com.servicemate.repository.model.ReviewStatus;
import com.servicemate.repository.model.ReviewReport;
import com.servicemate.repository.model.ReviewVote;
import com.servicemate.repository.model.User;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final ReviewVoteRepository reviewVoteRepository;
    private final ReviewReportRepository reviewReportRepository;

    @Transactional
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

        Review review = new Review();
        review.setBooking(booking);
        review.setRating(reviewRequest.getRating());
        review.setComment(reviewRequest.getComment());

        Review savedReview = reviewRepository.save(review);
        return mapToResponse(savedReview);
    }

    @Transactional
    public int markHelpful(Long reviewId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new SecurityException("User not found"));

        if (reviewVoteRepository.existsByReviewIdAndUserId(reviewId, user.getId())) {
            throw new IllegalStateException("You have already voted on this review.");
        }

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found with ID: " + reviewId));

        if (review.getHelpfulCount() == null) {
            review.setHelpfulCount(0);
        }
        review.setHelpfulCount(review.getHelpfulCount() + 1);
        reviewRepository.save(review);

        ReviewVote vote = new ReviewVote();
        vote.setReview(review);
        vote.setUser(user);
        reviewVoteRepository.save(vote);

        return review.getHelpfulCount();
    }

    @Transactional
    public void reportReview(Long reviewId, String reason) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found with ID: " + reviewId));

        ReviewReport report = new ReviewReport();
        report.setReview(review);
        report.setReason(reason);
        reviewReportRepository.save(report);

        // Check if the report count exceeds the threshold
        if (reviewReportRepository.countByReviewId(reviewId) > 5) {
            review.setStatus(ReviewStatus.HIDDEN);
            reviewRepository.save(review);
        }
    }

    // --- Admin Methods ---

    @Transactional(readOnly = true)
    public List<ReviewReport> getAllReports() {
        return reviewReportRepository.findAll();
    }

    @Transactional
    public void deleteReviewAsAdmin(Long reviewId) {
        if (!reviewRepository.existsById(reviewId)) {
            throw new IllegalArgumentException("Review not found with ID: " + reviewId);
        }
        // Delete associated votes and reports before deleting the review
        reviewVoteRepository.deleteByReviewId(reviewId);
        reviewReportRepository.deleteByReviewId(reviewId);
        reviewRepository.deleteById(reviewId);
    }

    @Transactional
    public void dismissReports(Long reviewId) {
        reviewReportRepository.deleteByReviewId(reviewId);
    }

    @Transactional
    public void approveReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found with ID: " + reviewId));
        review.setStatus(ReviewStatus.VISIBLE);
        reviewRepository.save(review);
        // Also clear the reports for this review
        reviewReportRepository.deleteByReviewId(reviewId);
    }

    /**
     * Retrieves all reviews for a given service.
     * @param serviceId The ID of the service.
     * @param sort The sorting parameter (e.g., "rating,desc").
     * @return A list of review response DTOs.
     */
    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsForService(Long serviceId, String sort) {
        List<Review> reviews = reviewRepository.findByBooking_ServiceId(serviceId).stream()
                .filter(review -> review.getStatus() == ReviewStatus.VISIBLE)
                .collect(Collectors.toList());

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
            default:
                comparator = Comparator.comparing(Review::getCreatedAt);
                break;
        }

        if ("desc".equalsIgnoreCase(direction)) {
            comparator = comparator.reversed();
        }

        return reviews.stream().sorted(comparator).map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * Retrieves average ratings for all services.
     * @return A map of ServiceID -> AverageRating
     */
    @Transactional(readOnly = true)
    public Map<Long, Double> getAverageRatings() {
        List<Object[]> results = reviewRepository.findAverageRatings();
        return results.stream().collect(Collectors.toMap(
                row -> (Long) row[0],
                row -> (Double) row[1]
        ));
    }

    private ReviewResponse mapToResponse(Review review) {
        ReviewResponse response = new ReviewResponse();
        response.setId(review.getId());
        response.setRating(review.getRating());
        response.setComment(review.getComment());
        response.setCreatedAt(review.getCreatedAt());
        response.setBookingId(review.getBooking().getId());

        // Fetch the customer's name to include in the response.
        userRepository.findById(review.getBooking().getCustomerId()).ifPresent(user -> {
            response.setCustomerName(user.getName());
        });

        return response;
    }
}