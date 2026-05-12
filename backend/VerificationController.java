package com.servicemate.controller;

import com.servicemate.repository.VerificationTokenRepository;
import com.servicemate.repository.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class VerificationController {

    private final VerificationTokenRepository verificationTokenRepository;
    private final com.servicemate.repository.UserRepository userRepository;

    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam String token) {
        return verificationTokenRepository.findByToken(token)
                .map(vToken -> {
                    User user = vToken.getUser();
                    user.setEmailVerified(true);
                    user.setVerificationToken(null); // Clear token after verification
                    userRepository.save(user);
                    return ResponseEntity.ok(Map.of("message", "Email verified successfully!"));
                })
                .orElse(ResponseEntity.badRequest().body(Map.of("error", "Invalid verification token")));
    }
}