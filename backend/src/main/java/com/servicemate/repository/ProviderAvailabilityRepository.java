package com.servicemate.repository;

import com.servicemate.repository.model.DayOfWeek;
import com.servicemate.repository.model.ProviderAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProviderAvailabilityRepository extends JpaRepository<ProviderAvailability, Long> {
    List<ProviderAvailability> findByProviderId(Long providerId);
    Optional<ProviderAvailability> findByProviderIdAndDayOfWeekAndStartTime(Long providerId, DayOfWeek dayOfWeek, java.time.LocalTime startTime);
    boolean existsByProviderIdAndDayOfWeekAndStartTimeAndEndTime(Long providerId, DayOfWeek dayOfWeek, java.time.LocalTime startTime, java.time.LocalTime endTime);
}