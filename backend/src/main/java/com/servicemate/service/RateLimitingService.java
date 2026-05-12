package com.servicemate.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitingService {

    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    public Bucket resolveBucket(String key, String role) {
        return cache.computeIfAbsent(key, k -> newBucket(role));
    }

    private Bucket newBucket(String role) {
        long capacity;
        if ("ADMIN".equals(role)) {
            // 100 requests per minute for Admins
            capacity = 100;
        } else if ("PROVIDER".equals(role)) {
            // 50 requests per minute for Providers
            capacity = 50;
        } else {
            // 20 requests per minute for Customers/Anonymous
            capacity = 20;
        }

        return Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(capacity)
                        .refillGreedy(capacity, Duration.ofMinutes(1))
                        .build())
                .build();
    }
}