package com.servicemate.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.SignatureException;
import io.jsonwebtoken.UnsupportedJwtException;
import java.util.Collections;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketConfig.class);

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable a simple memory-based message broker
        // /topic: for broadcasting messages to many users
        // /queue: for sending messages to specific users
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register the "/ws" endpoint, enabling SockJS fallback
        registry.addEndpoint("/ws").setAllowedOriginPatterns("*").withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                
                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    // Extract JWT token from the headers
                    // In frontend: stompClient.connect({ 'Authorization': 'Bearer <token>' }, ...)
                    String authHeader = accessor.getFirstNativeHeader("Authorization");
                    
                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        String token = authHeader.substring(7);
                        try {
                            byte[] keyBytes = jwtSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8);
                            var signingKey = io.jsonwebtoken.security.Keys.hmacShaKeyFor(keyBytes);
                            
                            Claims claims = Jwts.parserBuilder()
                                    .setSigningKey(signingKey)
                                    .build()
                                    .parseClaimsJws(token)
                                    .getBody();
                            String username = claims.getSubject();
                            String role = claims.get("role", String.class);
                            GrantedAuthority authority = new SimpleGrantedAuthority(role);

                            UsernamePasswordAuthenticationToken user = new UsernamePasswordAuthenticationToken(
                                    username, null, Collections.singletonList(authority));
                            accessor.setUser(user);
                            logger.info("WebSocket user authenticated: {}", username);
                        } catch (ExpiredJwtException e) {
                            logger.warn("WebSocket connection failed: JWT token is expired: {}", e.getMessage());
                        } catch (UnsupportedJwtException e) {
                            logger.warn("WebSocket connection failed: JWT token is unsupported: {}", e.getMessage());
                        } catch (MalformedJwtException e) {
                            logger.warn("WebSocket connection failed: Invalid JWT token: {}", e.getMessage());
                        } catch (SignatureException e) {
                            logger.warn("WebSocket connection failed: Invalid JWT signature: {}", e.getMessage());
                        } catch (IllegalArgumentException e) {
                            logger.warn("WebSocket connection failed: JWT claims string is empty: {}", e.getMessage());
                        }
                    }
                }
                return message;
            }
        });
    }
}