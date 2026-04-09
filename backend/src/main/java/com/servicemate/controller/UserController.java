package com.servicemate.controller;

import com.servicemate.repository.UserRepository;
import com.servicemate.repository.model.User;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/profile")
    public ResponseEntity<User> updateProfile(@RequestBody User profileData) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).map(user -> {
            user.setName(profileData.getName());
            user.setPhone(profileData.getPhone());
            // Email change is usually more complex (verification), keeping it simple for now
            return ResponseEntity.ok(userRepository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        String currentPassword = request.get("currentPassword");
        String newPassword = request.get("newPassword");

        return userRepository.findByEmail(email).map(user -> {
            if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Incorrect current password"));
            }
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/online")
    @PreAuthorize("hasAuthority('ADMIN')")
    public List<User> getOnlineUsers() {
        return userRepository.findByIsOnlineTrue();
    }

    @GetMapping("/online/count")
    @PreAuthorize("hasAuthority('ADMIN')")
    public Map<String, Long> getOnlineUserCount() {
        Map<String, Long> response = new HashMap<>();
        response.put("count", userRepository.countByIsOnlineTrue());
        return response;
    }
}