package com.servicemate.controller;

import com.servicemate.repository.ServiceRepository;
import com.servicemate.repository.UserRepository;
import com.servicemate.repository.model.ServiceItem;
import com.servicemate.repository.model.User;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.stream.Collectors;
import java.util.List;

@RestController
@RequestMapping("/api/services")
@CrossOrigin(origins = "*")
@Tag(name = "Service Management", description = "APIs for managing service listings (Providers)")
@SecurityRequirement(name = "bearerAuth")
public class ServiceController {

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<ServiceItem>> getAll() {
        return ResponseEntity.ok(serviceRepository.findAll());
    }

    @GetMapping("/provider")
    public ResponseEntity<List<ServiceItem>> getByProvider() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(serviceRepository.findByProviderId(user.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServiceItem> getById(@PathVariable Long id) {
        return serviceRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Search services with advanced filters")
    @GetMapping("/search/advanced")
    public ResponseEntity<List<ServiceItem>> searchServices(
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) String category) {
        
        // Note: For production, this filtering should be handled by a custom Repository method or JPA Specification
        List<ServiceItem> filtered = serviceRepository.findAll().stream()
                .filter(s -> (category == null || s.getCategory().equalsIgnoreCase(category)))
                .filter(s -> (minPrice == null || s.getPrice() >= minPrice))
                .filter(s -> (maxPrice == null || s.getPrice() <= maxPrice))
                .collect(Collectors.toList());

        return ResponseEntity.ok(filtered);
    }

    @PostMapping("/create")
    public ResponseEntity<ServiceItem> create(@RequestBody ServiceItem service) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        service.setProviderId(user.getId());
        return ResponseEntity.ok(serviceRepository.save(service));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody ServiceItem serviceDetails) {
        ServiceItem serviceItem = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found with id: " + id));

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        if (!serviceItem.getProviderId().equals(user.getId())) {
            return ResponseEntity.status(403).build();
        }

        serviceItem.setName(serviceDetails.getName());
        serviceItem.setPrice(serviceDetails.getPrice());
        serviceItem.setDescription(serviceDetails.getDescription());

        return ResponseEntity.ok(serviceRepository.save(serviceItem));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        ServiceItem serviceItem = serviceRepository.findById(id).orElse(null);
        if (serviceItem == null) {
            // Return 404 Not Found if the service doesn't exist
            return ResponseEntity.notFound().build();
        }

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        if (!serviceItem.getProviderId().equals(user.getId())) {
            return ResponseEntity.status(403).build();
        }

        serviceRepository.deleteById(id);
        // Return 204 No Content on successful deletion
        return ResponseEntity.noContent().build();
    }
}