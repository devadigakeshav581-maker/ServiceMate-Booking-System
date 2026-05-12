package com.servicemate.controller;

import com.servicemate.dto.MonthlyRevenueResponse;
import com.servicemate.service.AdminReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
@Tag(name = "Admin Reports", description = "Specialized endpoints for business analytics")
@SecurityRequirement(name = "bearerAuth")
public class AdminReportController {
    private final AdminReportService adminReportService;

    @GetMapping("/revenue/monthly")
    @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Get monthly revenue trend", description = "Returns a list of revenue aggregated by month for chart visualization.")
    public ResponseEntity<List<MonthlyRevenueResponse>> getMonthlyRevenue() {
        return ResponseEntity.ok(adminReportService.getMonthlyRevenueChartData());
    }
}