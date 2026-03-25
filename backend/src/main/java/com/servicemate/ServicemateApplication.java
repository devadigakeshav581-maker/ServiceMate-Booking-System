package com.servicemate;

import com.servicemate.repository.UserRepository;
import com.servicemate.repository.model.User;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.List;

@SpringBootApplication
@EnableScheduling
public class ServicemateApplication {

    public static void main(String[] args) {
        SpringApplication.run(ServicemateApplication.class, args);
    }

    @Bean
    CommandLineRunner resetOnlineStatus(UserRepository userRepository) {
        return args -> {
            List<User> onlineUsers = userRepository.findByIsOnlineTrue();
            if (!onlineUsers.isEmpty()) {
                onlineUsers.forEach(user -> user.setIsOnline(false));
                userRepository.saveAll(onlineUsers);
                System.out.println(">>> Reset " + onlineUsers.size() + " users to OFFLINE status on startup.");
            }
        };
    }
}
