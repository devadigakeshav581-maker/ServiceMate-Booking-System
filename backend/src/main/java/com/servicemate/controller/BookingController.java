package com.servicemate.controller;

import com.servicemate.dto.ActivityDto;
import com.servicemate.dto.BookingRequest;
import com.servicemate.dto.BookingResponse;
import com.servicemate.repository.model.Booking;
import com.servicemate.repository.UserRepository;
import com.servicemate.repository.model.User;
import com.servicemate.service.RealTimeService;
import com.servicemate.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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

    @Autowired
    private RealTimeService realTimeService;

    @Autowired
    private UserRepository userRepository;

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
        Booking newBooking = bookingService.createBooking(request);
        String activityMessage = String.format("New booking (#%d) created by customer.", newBooking.getId());
        realTimeService.broadcastActivity(new ActivityDto("BOOKING_CREATED", activityMessage));
        return ResponseEntity.ok(newBooking);
    }

    @PutMapping("/confirm/{id}")
    public ResponseEntity<Booking> confirmBooking(@PathVariable Long id) {
        Booking booking = bookingService.confirmBooking(id);
        String activityMessage = String.format("Booking #%d was confirmed.", booking.getId());
        realTimeService.broadcastActivity(new ActivityDto("BOOKING_CONFIRMED", activityMessage));
        notifyCustomerOfStatusChange(booking, "Your booking has been confirmed!");
        return ResponseEntity.ok(booking);
    }

    @PutMapping("/complete/{id}")
    public ResponseEntity<Booking> completeBooking(@PathVariable Long id) {
        Booking booking = bookingService.completeBooking(id);
        String activityMessage = String.format("Booking #%d was completed.", booking.getId());
        realTimeService.broadcastActivity(new ActivityDto("BOOKING_COMPLETED", activityMessage));
        notifyCustomerOfStatusChange(booking, "Your booking is now complete. Thank you!");
        return ResponseEntity.ok(booking);
    }

    @PutMapping("/cancel/{id}")
    public ResponseEntity<Booking> cancelBooking(@PathVariable Long id) {
        Booking booking = bookingService.cancelBooking(id);
        String activityMessage = String.format("Booking #%d was cancelled.", booking.getId());
        realTimeService.broadcastActivity(new ActivityDto("BOOKING_CANCELLED", activityMessage));
        notifyCustomerOfStatusChange(booking, "Your booking has been cancelled.");
        return ResponseEntity.ok(booking);
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

    private void notifyCustomerOfStatusChange(Booking booking, String message) {
        userRepository.findById(booking.getCustomerId()).ifPresent(customer -> {
            String notificationType = "BOOKING_" + booking.getStatus().name();
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", notificationType);
            payload.put("bookingId", booking.getId());
            payload.put("message", message);
            realTimeService.notifyUser(customer.getEmail(), payload);
        });
    }
}
