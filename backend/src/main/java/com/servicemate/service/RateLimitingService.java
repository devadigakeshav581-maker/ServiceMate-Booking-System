package com.servicemate.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
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
        Bandwidth limit;
        if ("ADMIN".equals(role)) {
            // 100 requests per minute for Admins
            limit = Bandwidth.classic(100, Refill.greedy(100, Duration.ofMinutes(1)));
        } else if ("PROVIDER".equals(role)) {
            // 50 requests per minute for Providers
            limit = Bandwidth.classic(50, Refill.greedy(50, Duration.ofMinutes(1)));
        } else {
            // 20 requests per minute for Customers/Anonymous
            limit = Bandwidth.classic(20, Refill.greedy(20, Duration.ofMinutes(1)));
        }

        return Bucket.builder()
                .addLimit(limit)
                .build();
    }
}