package com.servicemate.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.servicemate.repository.model.*;

import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByCustomerId(Long customerId);
    List<Booking> findByServiceId(Long serviceId);
    
    long countByStatus(BookingStatus status);
    
    @org.springframework.data.jpa.repository.Query(
        "SELECT b FROM Booking b JOIN ServiceItem s ON b.serviceId = s.id WHERE s.providerId = :providerId"
    )
    List<Booking> findByProviderId(@org.springframework.data.repository.query.Param("providerId") Long providerId);

    @org.springframework.data.jpa.repository.Query(
        "SELECT COALESCE(SUM(s.price), 0) FROM Booking b JOIN ServiceItem s ON b.serviceId = s.id WHERE b.status = 'COMPLETED'"
    )
    Double calculateTotalRevenue();
}
