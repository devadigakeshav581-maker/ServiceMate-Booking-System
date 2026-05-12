package com.servicemate.repository;

import com.servicemate.repository.model.Payment;
import com.servicemate.dto.MonthlyRevenueResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByTransactionRef(String transactionRef);

    Optional<Payment> findByBookingId(Long bookingId);

    @Query("SELECT new com.servicemate.dto.MonthlyRevenueResponse(FUNCTION('DATE_FORMAT', p.paymentDate, '%Y-%m'), SUM(p.amount)) " +
           "FROM Payment p WHERE p.status = 'SUCCESS' " +
           "GROUP BY FUNCTION('DATE_FORMAT', p.paymentDate, '%Y-%m') " +
           "ORDER BY FUNCTION('DATE_FORMAT', p.paymentDate, '%Y-%m') ASC")
    List<MonthlyRevenueResponse> getMonthlyRevenueTrend();
}