package com.servicemate.service;

import com.servicemate.dto.BookingRequest;
import com.servicemate.dto.BookingResponse;
import com.servicemate.repository.*;
import com.servicemate.repository.model.*;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String mailFrom;

    public Booking createBooking(BookingRequest request) {
        serviceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new RuntimeException("Service not found!"));

        Booking booking = new Booking();
        booking.setCustomerId(request.getCustomerId());
        booking.setServiceId(request.getServiceId());
        booking.setStatus(BookingStatus.PENDING);
        booking.setAddress(request.getAddress());
        booking.setNotes(request.getNotes());
        booking.setBookingDate(LocalDateTime.now());

        return bookingRepository.save(booking);
    }

    public Booking confirmBooking(Long id) {
        Booking booking = getById(id);
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setConfirmedAt(LocalDateTime.now());
        return bookingRepository.save(booking);
    }

    public Booking completeBooking(Long id) {
        Booking booking = getById(id);
        booking.setStatus(BookingStatus.COMPLETED);
        booking.setCompletedAt(LocalDateTime.now());

        // Send invoice email with attachment
        User customer = userRepository.findById(booking.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            // Use true to indicate multipart message
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "utf-8");

            String htmlMsg = "<h3>Booking Completed!</h3>"
                    + "<p>Hi " + customer.getName() + ",</p>"
                    + "<p>Your booking #" + booking.getId() + " has been marked as completed. Please find your invoice attached.</p>";

            helper.setText(htmlMsg, true);
            helper.setTo(customer.getEmail());
            helper.setSubject("Your ServiceMate Invoice for Booking #" + booking.getId());
            helper.setFrom(mailFrom);
            helper.addAttachment("invoice.pdf", new ClassPathResource("invoice.pdf"));
            mailSender.send(mimeMessage);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send invoice email", e);
        }

        return bookingRepository.save(booking);
    }

    public Booking cancelBooking(Long id) {
        Booking booking = getById(id);
        if (booking.getStatus() == BookingStatus.COMPLETED) {
            throw new RuntimeException("Cannot cancel a completed booking!");
        }
        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledAt(LocalDateTime.now());
        return bookingRepository.save(booking);
    }

    public List<BookingResponse> getByCustomer(Long customerId) {
        return bookingRepository.findByCustomerId(customerId).stream().map(this::mapToBookingResponse).collect(Collectors.toList());
    }

    public List<Booking> getByService(Long serviceId) {
        return bookingRepository.findByServiceId(serviceId);
    }

    public Booking getById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found!"));
    }

    public List<Booking> getBookingsByDate(LocalDate date) {
        return bookingRepository.findAll().stream()
                .filter(b -> b.getBookingDate().toLocalDate().equals(date))
                .collect(Collectors.toList());
    }

    public Page<Booking> getAllBookings(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("bookingDate").descending());
        return bookingRepository.findAll(pageable);
    }

    public Page<Booking> getAllBookings(int page, int size, String customerName) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("bookingDate").descending());
        Page<Booking> bookings = bookingRepository.findAll(pageable);
        List<Booking> filteredBookings = bookings.getContent().stream()
                .filter(booking -> booking.getCustomerId().toString().toLowerCase().contains(customerName.toLowerCase()))
                .collect(Collectors.toList());
        return new org.springframework.data.domain.PageImpl<>(filteredBookings, pageable, filteredBookings.size());
    }

    private BookingResponse mapToBookingResponse(Booking booking) {
        BookingResponse response = new BookingResponse();
        response.setId(booking.getId());
        response.setCustomerId(booking.getCustomerId());
        response.setServiceId(booking.getServiceId());
        response.setStatus(booking.getStatus());
        response.setAddress(booking.getAddress());
        response.setNotes(booking.getNotes());
        response.setBookingDate(booking.getBookingDate());
        response.setConfirmedAt(booking.getConfirmedAt());
        response.setCompletedAt(booking.getCompletedAt());
        response.setCancelledAt(booking.getCancelledAt());

        serviceRepository.findById(booking.getServiceId()).ifPresent(service -> {
            response.setServiceName(service.getName());
        });
        return response;
    }
}
