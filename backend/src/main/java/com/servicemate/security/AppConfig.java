package com.servicemate.security;

import com.servicemate.repository.UserRepository;
import com.servicemate.repository.model.Role;
import com.servicemate.repository.model.User;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AppConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CommandLineRunner initUsers(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            createOrUpdateUser(userRepository, passwordEncoder, "admin@servicemate.com", "123456", Role.ADMIN, "System Admin");
            createOrUpdateUser(userRepository, passwordEncoder, "customer@servicemate.com", "123456", Role.CUSTOMER, "John Doe");
            createOrUpdateUser(userRepository, passwordEncoder, "provider@servicemate.com", "123456", Role.PROVIDER, "Service Provider");
        };
    }

    private void createOrUpdateUser(UserRepository repo, PasswordEncoder encoder, String email, String password, Role role, String name) {
        User user = repo.findByEmail(email).orElse(new User());

        if (user.getId() == null) {
            user.setEmail(email);
            user.setName(name);
            user.setPhone("1234567890");
            user.setRole(role);
        }
        user.setPassword(encoder.encode(password));
        user.setIsVerified(true); // Default users are auto-verified
        repo.save(user);
        System.out.println(">>> USER SYNCED: " + email);
    }
}