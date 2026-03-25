package com.servicemate.controller;

import com.servicemate.dto.ChatMessageRequest;
import com.servicemate.dto.ChatMessageResponse;
import com.servicemate.service.ChatService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/chats")
@CrossOrigin(origins = "*")
@Tag(name = "Chat Management", description = "APIs for sending and retrieving chat messages")
@SecurityRequirement(name = "bearerAuth")
public class ChatMessageController {

    private final ChatService chatService;

    public ChatMessageController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping("/{bookingId}/messages")
    public ResponseEntity<ChatMessageResponse> sendMessage(@PathVariable Long bookingId, @RequestBody ChatMessageRequest request, Principal principal) {
        return ResponseEntity.ok(chatService.saveAndBroadcastMessage(bookingId, request, principal));
    }

    @GetMapping("/{bookingId}/messages")
    public ResponseEntity<List<ChatMessageResponse>> getMessages(@PathVariable Long bookingId) {
        return ResponseEntity.ok(chatService.getMessagesForBooking(bookingId));
    }
}