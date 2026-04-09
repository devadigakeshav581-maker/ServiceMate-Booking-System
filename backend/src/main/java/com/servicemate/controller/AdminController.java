package com.servicemate.controller;

import com.servicemate.repository.BookingRepository;
import com.servicemate.repository.ServiceRepository;
import com.servicemate.repository.UserRepository;
import com.servicemate.repository.model.*;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
@SecurityRequirement(name = "bearerAuth")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @GetMapping("/users")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PutMapping("/users/{userId}/role")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<User> updateUserRole(
            @PathVariable Long userId,
            @RequestBody Map<String, String> roleRequest) {
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        String newRole = roleRequest.get("role");
        if (newRole == null || !List.of("CUSTOMER", "PROVIDER", "ADMIN").contains(newRole)) {
            throw new IllegalArgumentException("Invalid role");
        }
        
        user.setRole(Role.valueOf(newRole));
        User updatedUser = userRepository.save(user);
        return ResponseEntity.ok(updatedUser);
    }

    @PutMapping("/users/{userId}/suspend")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<User> suspendUser(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setIsActive(false);
        User updatedUser = userRepository.save(user);
        return ResponseEntity.ok(updatedUser);
    }

    @PutMapping("/users/{userId}/activate")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<User> activateUser(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setIsActive(true);
        User updatedUser = userRepository.save(user);
        return ResponseEntity.ok(updatedUser);
    }

    @DeleteMapping("/users/{userId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long userId) {
        if (!userRepository.existsById(userId)) {
            return ResponseEntity.notFound().build();
        }
        userRepository.deleteById(userId);
        return ResponseEntity.noContent().build();
    }
}
