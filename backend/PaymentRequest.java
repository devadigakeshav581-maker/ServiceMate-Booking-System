package com.servicemate.dto;

import com.servicemate.model.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PaymentRequest {
    @NotNull(message = "Booking ID is required")
    private Long bookingId;
    
    @NotNull(message = "Amount is required")
    private Double amount;
    
    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;

    // UPI Specific fields
    private String upiId; // e.g., user@okaxis

    // Card Specific fields (Simulated)
    private String cardNumber;
    private String expiryDate;
    private String cvv;
    private String cardHolderName;

    private String transactionNote;
}