package com.servicemate.controller;

import com.servicemate.repository.UserRepository;
import com.servicemate.service.AuthService;
import com.servicemate.repository.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@Tag(name = "User Management", description = "APIs for managing user accounts (Admin only)")
@SecurityRequirement(name = "bearerAuth") // Apply security to all endpoints in this controller
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthService authService;

    @Operation(summary = "Get all users", description = "Retrieves a list of all registered users. Requires ADMIN role.")
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @Operation(summary = "Delete a user", description = "Deletes a user by their ID. Requires ADMIN role.")
    @ApiResponse(responseCode = "200", description = "User deleted successfully")
    @ApiResponse(responseCode = "404", description = "User not found")
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok("User deleted successfully");
    }

    @Operation(summary = "Update user status", description = "Activates or suspends a user account. Requires ADMIN role.")
    @ApiResponse(responseCode = "200", description = "User status updated successfully")
    @ApiResponse(responseCode = "404", description = "User not found")
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateUserStatus(
            @PathVariable Long id,
            @Parameter(description = "The new status for the user (true for active, false for suspended)") @RequestParam boolean isActive) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setIsActive(isActive);
        return ResponseEntity.ok(userRepository.save(user));
    }

    @Operation(summary = "Send a warning email to a user", description = "Sends a custom warning message to a user's email address. Requires ADMIN role.")
    @ApiResponse(responseCode = "200", description = "Warning email sent successfully")
    @ApiResponse(responseCode = "404", description = "User not found")
    @PostMapping("/{id}/warn")
    public ResponseEntity<?> sendWarningEmail(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        try {
            authService.sendWarningEmail(id, payload.get("message"));
            return ResponseEntity.ok(Map.of("message", "Warning email sent successfully."));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }
}