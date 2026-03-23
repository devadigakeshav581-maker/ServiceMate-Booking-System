package com.servicemate.controller;

import com.servicemate.dto.*;
import com.servicemate.service.PaymentService;
import com.servicemate.repository.model.Payment;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
@Tag(name = "Payment Processing", description = "APIs for processing payments and checking status")
@SecurityRequirement(name = "bearerAuth")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @Operation(summary = "Process a payment for a booking")
    @PostMapping("/pay")
    public ResponseEntity<PaymentResponse> processPayment(@RequestBody PaymentRequest request) {
        return ResponseEntity.ok(paymentService.processPayment(request));
    }

    @Operation(summary = "Get payment status for a booking")
    @GetMapping("/status/{bookingId}")
    public ResponseEntity<PaymentResponse> getPaymentStatus(@PathVariable Long bookingId) {
        return ResponseEntity.ok(paymentService.getPaymentStatus(bookingId));
    }

    @Operation(summary = "Get all payments for a customer (Admin)", description = "Requires ADMIN role.")
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Payment>> getPaymentsByCustomer(@PathVariable Long customerId) {
        // Assumes implementation exists in PaymentService
        return ResponseEntity.ok(paymentService.getPaymentsByCustomer(customerId));
    }

    @Operation(summary = "Refund a payment (Admin)", description = "Requires ADMIN role. This simulates a refund and updates the payment status.")
    @ApiResponse(responseCode = "200", description = "Payment refunded successfully")
    @PostMapping("/{paymentId}/refund")
    public ResponseEntity<PaymentResponse> refundPayment(@PathVariable String paymentId) {
        // Assumes implementation exists in PaymentService
        return ResponseEntity.ok(paymentService.refundPayment(paymentId));
    }

    @Operation(summary = "Download a payment receipt (Admin)", description = "Requires ADMIN role. Returns a PDF receipt for the given payment.")
    @GetMapping("/{paymentId}/receipt")
    public ResponseEntity<Resource> downloadReceipt(@PathVariable String paymentId) {
        // In a real app, you would generate a PDF for this specific paymentId.
        // For this demo, we will return a static invoice file.
        Resource resource = new ClassPathResource("invoice.pdf");

        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"receipt-" + paymentId + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(resource);
    }
}
