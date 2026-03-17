package com.servicemate.controller;

import com.servicemate.dto.*;
import com.servicemate.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
@Tag(name = "Authentication", description = "APIs for user registration, login, and password management")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Operation(summary = "Register a new user", description = "Creates a new user account and sends a verification email.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Registration successful, verification email sent"),
            @ApiResponse(responseCode = "400", description = "Email is already registered")
    })
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @Operation(summary = "Authenticate a user", description = "Logs in a user and returns a JWT token upon successful authentication.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Login successful", content = @Content(schema = @Schema(implementation = String.class, example = "eyJhbGciOiJIUzI1NiJ9..."))),
            @ApiResponse(responseCode = "401", description = "Invalid credentials or unverified account")
    })
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @Operation(summary = "Verify user email", description = "Verifies a user's email address using a token sent during registration.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Email verified successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid or expired token")
    })
    @GetMapping("/verify")
    public ResponseEntity<?> verifyEmail(@Parameter(description = "The verification token from the email link") @RequestParam String token) {
        return ResponseEntity.ok(authService.verifyEmail(token));
    }

    @Operation(summary = "Request a password reset", description = "Initiates the password reset process by sending an email with a reset token.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Password reset link sent"),
            @ApiResponse(responseCode = "404", description = "User with the given email not found")
    })
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Parameter(description = "The email address of the user who forgot their password", example = "customer@servicemate.com") @RequestParam String email) {
        return ResponseEntity.ok(authService.forgotPassword(email));
    }

    @Operation(summary = "Reset user password", description = "Sets a new password for a user using a valid reset token.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Password has been reset successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid or expired token")
    })
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @Parameter(description = "The password reset token from the email link") @RequestParam String token,
            @Parameter(description = "The new password for the user (min 8 characters)") @RequestParam String newPassword) {
        return ResponseEntity.ok(authService.resetPassword(token, newPassword));
    }
}
