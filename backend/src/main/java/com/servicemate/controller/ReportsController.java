package com.servicemate.controller;

import com.servicemate.repository.BookingRepository;
import com.servicemate.repository.ServiceRepository;
import com.servicemate.repository.UserRepository;
import com.servicemate.repository.model.*;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
@SecurityRequirement(name = "bearerAuth")
public class ReportsController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @GetMapping("/overview")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Map<String, Object>> getOverview() {
        Map<String, Object> response = new HashMap<>();
        
        // Total users by role
        response.put("totalUsers", userRepository.count());
        response.put("totalCustomers", userRepository.countByRole(Role.CUSTOMER));
        response.put("totalProviders", userRepository.countByRole(Role.PROVIDER));
        response.put("totalAdmins", userRepository.countByRole(Role.ADMIN));
        
        // Booking statistics
        response.put("totalBookings", bookingRepository.count());
        response.put("pendingBookings", bookingRepository.countByStatus(BookingStatus.PENDING));
        response.put("confirmedBookings", bookingRepository.countByStatus(BookingStatus.CONFIRMED));
        response.put("completedBookings", bookingRepository.countByStatus(BookingStatus.COMPLETED));
        response.put("cancelledBookings", bookingRepository.countByStatus(BookingStatus.CANCELLED));
        
        // Calculate total revenue (sum of all completed bookings)
        Double totalRevenue = bookingRepository.calculateTotalRevenue();
        response.put("totalRevenue", totalRevenue != null ? totalRevenue : 0);
        
        // Pending issues (could be reported reviews, disputes, etc.)
        // For now, we'll use pending bookings as a proxy
        response.put("pendingIssues", bookingRepository.countByStatus(BookingStatus.PENDING));
        
        return ResponseEntity.ok(response);
    }
}
