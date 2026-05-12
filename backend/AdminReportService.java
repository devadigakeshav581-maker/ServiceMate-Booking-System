package com.servicemate.service;

import com.servicemate.dto.MonthlyRevenueResponse;
import com.servicemate.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminReportService {
    private final PaymentRepository paymentRepository;

    @Transactional(readOnly = true)
    public List<MonthlyRevenueResponse> getMonthlyRevenueChartData() {
        return paymentRepository.getMonthlyRevenueTrend();
    }
}