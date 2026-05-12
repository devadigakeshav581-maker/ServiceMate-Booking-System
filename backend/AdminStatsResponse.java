package com.servicemate.dto;

import lombok.Data;

@Data
public class AdminStatsResponse {
    private long totalUsers;
    private long totalCustomers;
    private long totalProviders;
    private long totalBookings;
    private long pendingBookings;
    private long completedBookings;
    private double totalRevenue;
}