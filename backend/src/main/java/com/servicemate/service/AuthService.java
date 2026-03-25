package com.servicemate.service;

import com.servicemate.dto.*;
import com.servicemate.repository.UserRepository;
import com.servicemate.repository.PasswordResetTokenRepository;
import com.servicemate.repository.VerificationTokenRepository;
import com.servicemate.repository.model.PasswordResetToken;
import com.servicemate.repository.model.User;
import com.servicemate.repository.model.VerificationToken;
import com.servicemate.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.UUID;

@Service
public class AuthService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Autowired
    private VerificationTokenRepository verificationTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String mailFrom;

    @Autowired
    private RealTimeService realTimeService;

    public String register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered!");
        }
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());
        user.setRole(request.getRole());
        user.setIsVerified(false); // Users must verify email
        userRepository.save(user);

        // Notify admins via WebSocket
        realTimeService.broadcastActivity(new ActivityDto("NEW_REGISTRATION", "New user registered: " + user.getEmail()));

        // Generate Verification Token
        String token = UUID.randomUUID().toString();
        VerificationToken vToken = new VerificationToken();
        vToken.setToken(token);
        vToken.setUser(user);
        vToken.setExpiryDate(LocalDateTime.now().plusHours(24));
        verificationTokenRepository.save(vToken);

        // Send Verification Email
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");
            String htmlMsg = "<h3>Welcome to ServiceMate!</h3>"
                    + "<p>Please verify your email address to activate your account.</p>"
                    + "<p><a href=\"http://localhost:8080/verify-email.html?token=" + token + "\">Verify Email</a></p>";
            
            helper.setText(htmlMsg, true);
            helper.setTo(user.getEmail());
            helper.setSubject("Verify your ServiceMate Account");
            helper.setFrom(mailFrom);
            mailSender.send(mimeMessage);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send verification email", e);
        }

        return "Registration successful! Please check your email to verify your account.";
    }

    public String login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found!"));

        if (!user.getIsVerified()) {
            throw new RuntimeException("Account not verified. Please check your email.");
        }

        if (!user.getIsActive()) {
            throw new RuntimeException("This account has been suspended.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password!");
        }

        return jwtUtil.generateToken(user.getEmail(), user.getRole().name());
    }

    public String forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUser(user);
        resetToken.setExpiryDate(LocalDateTime.now().plusMinutes(30)); // 30 min expiration
        tokenRepository.save(resetToken);

        // Send the actual email (HTML)
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");
            String htmlMsg = "<h3>ServiceMate Password Reset</h3>"
                    + "<p>To complete the password reset process, please click the link below:</p>"
                    + "<p><a href=\"http://localhost:8080/reset-password.html?token=" + token + "\">Reset Password</a></p>"
                    + "<br><p>If you did not request this, please ignore this email.</p>";
            
            helper.setText(htmlMsg, true); // true = send as HTML
            helper.setTo(user.getEmail());
            helper.setSubject("Complete Password Reset!");
            helper.setFrom(mailFrom);
            mailSender.send(mimeMessage);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send email", e);
        }

        return "A password reset link has been sent to " + user.getEmail();
    }

    public String verifyEmail(String token) {
        VerificationToken vToken = verificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid verification token"));

        if (vToken.isExpired()) {
            throw new RuntimeException("Token has expired");
        }

        User user = vToken.getUser();
        user.setIsVerified(true);
        userRepository.save(user);
        verificationTokenRepository.delete(vToken);

        return "Email verified successfully! You can now login.";
    }

    public String resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid token"));

        if (resetToken.isExpired()) {
            throw new RuntimeException("Token has expired");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        tokenRepository.delete(resetToken);

        return "Password reset successfully!";
    }

    public void sendWarningEmail(Long userId, String message) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");
            String htmlMsg = "<h3>Warning from ServiceMate Admin</h3>"
                    + "<p>Hello " + user.getName() + ",</p>"
                    + "<p>You have received a warning regarding your account activity:</p>"
                    + "<blockquote style=\"border-left: 4px solid #f59e0b; padding-left: 1em; margin: 1em 0; color: #ccc;\">"
                    + message
                    + "</blockquote>"
                    + "<p>Please adhere to our platform guidelines to avoid further action, including account suspension.</p>"
                    + "<br><p>Regards,<br>The ServiceMate Team</p>";

            helper.setText(htmlMsg, true);
            helper.setTo(user.getEmail());
            helper.setSubject("Important: A Warning Regarding Your ServiceMate Account");
            helper.setFrom(mailFrom);
            mailSender.send(mimeMessage);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send warning email", e);
        }
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + username));

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                Collections.singletonList(new org.springframework.security.core.authority.SimpleGrantedAuthority(user.getRole().name()))
        );
    }
}
