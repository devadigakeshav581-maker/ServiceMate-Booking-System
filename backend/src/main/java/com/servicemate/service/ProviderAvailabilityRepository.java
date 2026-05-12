package com.servicemate.service;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProviderAvailabilityRepository extends JpaRepository<ProviderAvailability, Long> {
    List<ProviderAvailability> findByProviderId(Long providerId);
    Optional<ProviderAvailability> findByProviderIdAndStartTime(Long providerId, LocalDateTime startTime);
    List<ProviderAvailability> findByProviderIdAndStartTimeBetween(Long providerId, LocalDateTime start, LocalDateTime end);
}