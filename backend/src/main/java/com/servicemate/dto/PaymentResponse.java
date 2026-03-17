package com.servicemate.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class PaymentResponse {
    private Long paymentId;
    private String status;
    private String message;
    private LocalDateTime paymentDate;
}
