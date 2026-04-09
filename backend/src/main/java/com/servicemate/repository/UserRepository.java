package com.servicemate.repository;

import com.servicemate.repository.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    List<User> findByIsOnlineTrue();
    long countByIsOnlineTrue();
    
    long countByRole(Role role);
}