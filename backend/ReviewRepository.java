package com.servicemate.repository;

import com.servicemate.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByServiceItemId(Long serviceItemId);
    boolean existsByCustomerIdAndServiceItemId(Long customerId, Long serviceItemId);
}