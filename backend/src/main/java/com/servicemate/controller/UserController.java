package com.servicemate.controller;

import com.servicemate.repository.UserRepository;
import com.servicemate.repository.model.User;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping("/profile")
    public ResponseEntity<User> getProfile() {
        return userRepository.findByEmail(getAuthenticatedEmail())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/profile")
    public ResponseEntity<User> updateProfile(@RequestBody User profileData) {
        return userRepository.findByEmail(getAuthenticatedEmail()).map(user -> {
            user.setName(profileData.getName());
            user.setPhone(profileData.getPhone());
            // Email change is usually more complex (verification), keeping it simple for now
            return ResponseEntity.ok(userRepository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> request) {
        String currentPassword = request.get("currentPassword");
        String newPassword = request.get("newPassword");

        return userRepository.findByEmail(getAuthenticatedEmail()).map(user -> {
            if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Incorrect current password"));
            }
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/profile-image")
    public ResponseEntity<?> updateProfileImage(@RequestBody Map<String, String> request) {
        String profileImage = request.get("profileImage");

        return userRepository.findByEmail(getAuthenticatedEmail()).map(user -> {
            user.setProfileImage(profileImage);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Profile image updated successfully"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/online")
    @PreAuthorize("hasAuthority('ADMIN')")
    public java.util.List<User> getOnlineUsers() {
        return userRepository.findByIsOnlineTrue();
    }

    @GetMapping("/online/count")
    @PreAuthorize("hasAuthority('ADMIN')")
    public Map<String, Long> getOnlineUserCount() {
        Map<String, Long> response = new HashMap<>();
        response.put("count", userRepository.countByIsOnlineTrue());
        return response;
    }

    private String getAuthenticatedEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}