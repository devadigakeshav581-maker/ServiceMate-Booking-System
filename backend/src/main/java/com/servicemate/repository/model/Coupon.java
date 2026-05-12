package com.servicemate.repository.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "coupons")
@Data
@NoArgsConstructor
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String code; // e.g., "SAVE20"

    @Column(nullable = false)
    private Integer discountPercentage; // e.g., 20

    private LocalDateTime validUntil;

    private Integer maxUses;

    @Column(columnDefinition = "integer default 0")
    private Integer timesUsed = 0;

    private Boolean isActive = true;
}