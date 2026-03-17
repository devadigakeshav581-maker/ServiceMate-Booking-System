package com.servicemate.service;

import com.servicemate.dto.*;
import com.servicemate.repository.BookingRepository;
import com.servicemate.repository.PaymentRepository;
import com.servicemate.repository.model.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private BookingRepository bookingRepository;

    public PaymentResponse processPayment(PaymentRequest request) {
        // Simulate payment success (90% success rate)
        boolean isSuccess = Math.random() < 0.9;

        Payment payment = new Payment();
        payment.setBookingId(request.getBookingId());
        payment.setAmount(request.getAmount());
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setStatus(isSuccess ? PaymentStatus.SUCCESS : PaymentStatus.FAILED);
        payment.setTransactionRef("TXN_SM_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        payment.setPaymentDate(LocalDateTime.now());

        paymentRepository.save(payment);

        return new PaymentResponse(
                payment.getId(),
                payment.getStatus().name(),
                isSuccess ? "Payment Successful! 🎉" : "Payment Failed. Please retry.",
                payment.getPaymentDate()
        );
    }

    public PaymentResponse getPaymentStatus(Long bookingId) {
        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new RuntimeException("Payment not found!"));

        return new PaymentResponse(
                payment.getId(),
                payment.getStatus().name(),
                "Payment status fetched successfully.",
                payment.getPaymentDate()
        );
    }

    public List<Payment> getPaymentsByCustomer(Long customerId) {
        return bookingRepository.findByCustomerId(customerId)
                .stream()
                .map(booking -> paymentRepository.findByBookingId(booking.getId()))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toList());
    }

    public PaymentResponse refundPayment(String transactionRef) {
        // TODO: Implement refund logic.
        // This requires updating the PaymentRepository to find by transaction reference
        // and updating the PaymentStatus enum and DB schema to include a 'REFUNDED' status.
        throw new UnsupportedOperationException("Refund functionality is not yet implemented.");
    }
}
