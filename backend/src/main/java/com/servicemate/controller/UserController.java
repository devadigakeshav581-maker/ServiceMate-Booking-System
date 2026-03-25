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

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    @Autowired
    private UserRepository userRepository;

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