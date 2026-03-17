package com.servicemate.dto;

import com.servicemate.repository.model.Role;

import lombok.Data;

@Data
public class RegisterRequest {
    private String name;
    private String email;
    private String password;
    private String phone;
    private Role role;
}
