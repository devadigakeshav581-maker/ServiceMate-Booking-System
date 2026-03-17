package com.servicemate.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.servicemate.repository.model.ServiceItem;

import java.util.List;

@Repository
public interface ServiceRepository extends JpaRepository<ServiceItem, Long> {
    List<ServiceItem> findByProviderId(Long providerId);
}
