package com.servicemate.repository;

import com.servicemate.repository.model.ReviewReport;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewReportRepository extends JpaRepository<ReviewReport, Long> {
    void deleteByReviewId(Long reviewId);
    long countByReviewId(Long reviewId);
}