package com.servicemate.controller;

import com.servicemate.dto.ReviewRequest;
import com.servicemate.dto.ReviewResponse;
import com.servicemate.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Configure properly for production
@Tag(name = "Review System", description = "APIs for creating and viewing ratings/reviews")
@SecurityRequirement(name = "bearerAuth")
public class ReviewController {

    private final ReviewService reviewService;

    /**
     * Endpoint for a customer to submit a review for a service.
     * Requires authentication.
     * @param request Review details.
     * @return Created review.
     */
    @Operation(summary = "Create a new review", description = "Allows a customer to submit a rating and comment for a completed booking.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Review created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input, e.g., booking not found or review already exists"),
            @ApiResponse(responseCode = "403", description = "Forbidden - User is not the owner of the booking or booking is not completed")
    })
    @PostMapping
    public ResponseEntity<?> createReview(@RequestBody ReviewRequest reviewRequest,
                                          @AuthenticationPrincipal UserDetails userDetails) {
        try {
            ReviewResponse createdReview = reviewService.createReview(reviewRequest, userDetails.getUsername());
            return new ResponseEntity<>(createdReview, HttpStatus.CREATED);
        } catch (SecurityException | IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Endpoint to get all reviews for a specific service item.
     * Accessible to all.
     * @param serviceItemId ID of the service item.
     * @return List of reviews for the service.
     */
    @Operation(summary = "Get reviews for a service", description = "Retrieves all reviews associated with a specific service ID.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved list of reviews")
    })
    @GetMapping("/service/{serviceItemId}")
    public ResponseEntity<List<ReviewResponse>> getReviewsForService(
            @PathVariable Long serviceItemId,
            @Parameter(description = "Sort reviews by 'rating', 'helpful', or 'createdAt'. Add ',desc' or ',asc'.", example = "createdAt,desc")
            @RequestParam(defaultValue = "createdAt,desc") String sort) {
        List<ReviewResponse> reviews = reviewService.getReviewsForService(serviceItemId, sort);
        return ResponseEntity.ok(reviews);
    }

    /**
     * Gets the average rating for all services.
     * Useful for displaying stars on dashboard cards.
     */
    @Operation(summary = "Get average ratings for all services", description = "Returns a map of service IDs to their calculated average rating.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved average ratings")
    })
    @GetMapping("/averages")
    public ResponseEntity<Map<Long, Double>> getAverageRatings() {
        return ResponseEntity.ok(reviewService.getAverageRatings());
    }

    @Operation(summary = "Mark review as helpful", description = "Increments the helpful count for a specific review.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Count incremented successfully"),
            @ApiResponse(responseCode = "400", description = "Review not found or already voted")
    })
    @PutMapping("/{id}/helpful")
    public ResponseEntity<?> markReviewHelpful(@PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        try {
            return ResponseEntity.ok(reviewService.markHelpful(id, userDetails.getUsername()));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Operation(summary = "Report a review", description = "Flags a review as inappropriate with a specific reason.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Review reported successfully"),
            @ApiResponse(responseCode = "400", description = "Review not found")
    })
    @PostMapping("/{id}/report")
    public ResponseEntity<?> reportReview(@PathVariable Long id,
                                          @Parameter(description = "Reason for reporting") @RequestParam String reason) {
        try {
            reviewService.reportReview(id, reason);
            return ResponseEntity.ok(Map.of("message", "Review reported successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}