package com.servicemate.controller;

import com.servicemate.dto.AdminStatsResponse;
import com.servicemate.repository.BookingRepository;
import com.servicemate.repository.UserRepository;
import com.servicemate.repository.model.BookingStatus;
import com.servicemate.repository.model.Role;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
@Tag(name = "Admin Dashboard", description = "Endpoints for administrative system overview")
@SecurityRequirement(name = "bearerAuth")
public class AdminDashboardController {

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;

    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Get system-wide statistics", description = "Aggregates counts for users, bookings, and total revenue.")
    public ResponseEntity<AdminStatsResponse> getSystemStats() {
        AdminStatsResponse response = new AdminStatsResponse();
        response.setTotalUsers(userRepository.count());
        response.setTotalCustomers(userRepository.countByRole(Role.CUSTOMER));
        response.setTotalProviders(userRepository.countByRole(Role.PROVIDER));
        response.setTotalBookings(bookingRepository.count());
        response.setPendingBookings(bookingRepository.countByStatus(BookingStatus.PENDING));
        response.setCompletedBookings(bookingRepository.countByStatus(BookingStatus.COMPLETED));
        response.setTotalRevenue(bookingRepository.calculateTotalRevenue() != null ? bookingRepository.calculateTotalRevenue() : 0.0);
        
        return ResponseEntity.ok(response);
    }
}