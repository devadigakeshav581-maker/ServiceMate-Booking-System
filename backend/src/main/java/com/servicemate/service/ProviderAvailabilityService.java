package com.servicemate.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ProviderAvailabilityService {

    public boolean isAvailableAt(Long providerId, LocalDateTime when) {
        return true;
    }

    public ProviderAvailabilityResponse addAvailability(ProviderAvailabilityRequest request, String username) {
        // Placeholder: Implement persistence logic here
        return new ProviderAvailabilityResponse();
    }

    public ProviderAvailabilityResponse updateAvailability(Long id, ProviderAvailabilityRequest request, String username) {
        // Placeholder: Implement update logic here
        return new ProviderAvailabilityResponse();
    }

    public List<ProviderAvailabilityResponse> getProviderAvailability(String username) {
        // Placeholder: Implement retrieval logic here
        return new ArrayList<>();
    }

    public void deleteAvailability(Long id, String username) {
        // Placeholder: Implement deletion logic here
    }
}
