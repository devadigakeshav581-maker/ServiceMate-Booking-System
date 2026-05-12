package com.servicemate.controller;

import com.servicemate.service.ProviderAvailabilityRequest;
import com.servicemate.service.ProviderAvailabilityResponse;
import com.servicemate.service.ProviderAvailabilityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/provider/availability")
@RequiredArgsConstructor
@Tag(name = "Provider Availability Management", description = "Endpoints for service providers to manage their availability.")
@SecurityRequirement(name = "bearerAuth")
public class ProviderAvailabilityController {

    private final ProviderAvailabilityService availabilityService;

    @Operation(summary = "Add a new availability slot for the authenticated provider.")
    @PostMapping
    public ResponseEntity<ProviderAvailabilityResponse> addAvailability(
            @Valid @RequestBody ProviderAvailabilityRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ProviderAvailabilityResponse newSlot = availabilityService.addAvailability(request, userDetails.getUsername());
        return new ResponseEntity<>(newSlot, HttpStatus.CREATED);
    }

    @Operation(summary = "Update an existing availability slot for the authenticated provider.")
    @PutMapping("/{id}")
    public ResponseEntity<ProviderAvailabilityResponse> updateAvailability(
            @PathVariable Long id,
            @Valid @RequestBody ProviderAvailabilityRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ProviderAvailabilityResponse updatedSlot = availabilityService.updateAvailability(id, request, userDetails.getUsername());
        return ResponseEntity.ok(updatedSlot);
    }

    @Operation(summary = "Get all availability slots for the authenticated provider.")
    @GetMapping
    public ResponseEntity<List<ProviderAvailabilityResponse>> getMyAvailability(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<ProviderAvailabilityResponse> availability = availabilityService.getProviderAvailability(userDetails.getUsername());
        if (availability.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }
        return ResponseEntity.ok(availability);
    }

    @Operation(summary = "Delete an availability slot for the authenticated provider.")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAvailability(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        availabilityService.deleteAvailability(id, userDetails.getUsername());
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}