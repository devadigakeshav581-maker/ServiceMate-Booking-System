package com.servicemate.controller;

import com.servicemate.repository.model.ReviewReport;
import com.servicemate.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/reviews")
@RequiredArgsConstructor
@Tag(name = "Admin: Review Management", description = "APIs for administrators to manage reported reviews.")
@SecurityRequirement(name = "bearerAuth")
public class AdminReviewController {

    private final ReviewService reviewService;

    @Operation(summary = "Get all reported reviews", description = "Retrieves a list of all review reports for moderation.")
    @GetMapping("/reports")
    public ResponseEntity<List<ReviewReport>> getReportedReviews() {
        return ResponseEntity.ok(reviewService.getAllReports());
    }

    @Operation(summary = "Delete a review", description = "Permanently deletes a review and all associated data (votes, reports). Use with caution.")
    @ApiResponses(value = { @ApiResponse(responseCode = "200", description = "Review deleted successfully"), @ApiResponse(responseCode = "404", description = "Review not found") })
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<?> deleteReview(@PathVariable Long reviewId) {
        reviewService.deleteReviewAsAdmin(reviewId);
        return ResponseEntity.ok(Map.of("message", "Review " + reviewId + " deleted successfully."));
    }

    @Operation(summary = "Dismiss reports for a review", description = "Deletes all reports for a specific review, keeping the review itself.")
    @ApiResponses(value = { @ApiResponse(responseCode = "200", description = "Reports dismissed successfully") })
    @DeleteMapping("/reports/{reviewId}")
    public ResponseEntity<?> dismissReports(@PathVariable Long reviewId) {
        reviewService.dismissReports(reviewId);
        return ResponseEntity.ok(Map.of("message", "Reports for review " + reviewId + " have been dismissed."));
    }

    @Operation(summary = "Approve a review", description = "Sets a review's status to VISIBLE and deletes all associated reports.")
    @ApiResponses(value = { @ApiResponse(responseCode = "200", description = "Review approved successfully") })
    @PutMapping("/approve/{reviewId}")
    public ResponseEntity<?> approveReview(@PathVariable Long reviewId) {
        reviewService.approveReview(reviewId);
        return ResponseEntity.ok(Map.of("message", "Review " + reviewId + " has been approved and is now visible."));
    }
}