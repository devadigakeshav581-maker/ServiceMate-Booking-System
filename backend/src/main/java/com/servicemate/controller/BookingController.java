package com.servicemate.controller;

import com.servicemate.dto.BookingRequest;
import com.servicemate.dto.BookingResponse;
import com.servicemate.repository.model.Booking;
import com.servicemate.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*")
@Tag(name = "Booking Management", description = "APIs for creating, retrieving, and managing bookings")
@SecurityRequirement(name = "bearerAuth")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @GetMapping
    public ResponseEntity<Page<Booking>> getAllBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "") String customerName) {
        if (customerName.isEmpty()) {
            return ResponseEntity.ok(bookingService.getAllBookings(page, size));
        } else {
            return ResponseEntity.ok(bookingService.getAllBookings(page, size, customerName));
        }



    }

    @PostMapping("/create")
    public ResponseEntity<Booking> createBooking(@RequestBody BookingRequest request) {
        return ResponseEntity.ok(bookingService.createBooking(request));
    }

    @PutMapping("/confirm/{id}")
    public ResponseEntity<Booking> confirmBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.confirmBooking(id));
    }

    @PutMapping("/complete/{id}")
    public ResponseEntity<Booking> completeBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.completeBooking(id));
    }

    @PutMapping("/cancel/{id}")
    public ResponseEntity<Booking> cancelBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.cancelBooking(id));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<BookingResponse>> getByCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(bookingService.getByCustomer(customerId));
    }

    @GetMapping("/service/{serviceId}")
    public ResponseEntity<List<Booking>> getByService(@PathVariable Long serviceId) {
        return ResponseEntity.ok(bookingService.getByService(serviceId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Booking> getBookingById(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.getById(id));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Booking>> searchBookings(@RequestParam(name = "date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(bookingService.getBookingsByDate(date));
    }
}
