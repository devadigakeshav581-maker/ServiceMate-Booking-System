package com.servicemate.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MonthlyRevenueResponse {
    private String month; // Format: YYYY-MM
    private Double revenue;
}