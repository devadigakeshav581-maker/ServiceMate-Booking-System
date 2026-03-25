package com.servicemate.service;

import com.servicemate.dto.ChatMessageRequest;
import com.servicemate.dto.ChatMessageResponse;
import com.servicemate.repository.BookingRepository;
import com.servicemate.repository.ChatMessageRepository;
import com.servicemate.repository.ServiceRepository;
import com.servicemate.repository.UserRepository;
import com.servicemate.repository.model.Booking;
import com.servicemate.repository.model.ChatMessage;
import com.servicemate.repository.model.User;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final ServiceRepository serviceRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final RealTimeService realTimeService;

    public ChatService(ChatMessageRepository chatMessageRepository, UserRepository userRepository, BookingRepository bookingRepository, ServiceRepository serviceRepository, SimpMessagingTemplate messagingTemplate, RealTimeService realTimeService) {
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
        this.serviceRepository = serviceRepository;
        this.messagingTemplate = messagingTemplate;
        this.realTimeService = realTimeService;
    }

    @Transactional
    public ChatMessageResponse saveAndBroadcastMessage(Long bookingId, ChatMessageRequest request, Principal principal) {
        User sender = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        ChatMessage chatMessage = new ChatMessage();
        chatMessage.setBooking(booking);
        chatMessage.setSender(sender);
        chatMessage.setText(request.getText());
        chatMessage.setSenderRole(request.getSenderRole());
        
        ChatMessage savedMessage = chatMessageRepository.save(chatMessage);
        ChatMessageResponse responseDto = toDto(savedMessage);

        // Broadcast to the public chat topic for users in the chat window
        messagingTemplate.convertAndSend("/topic/chat/" + bookingId, responseDto);

        // Send a private notification to the recipient for the unread badge
        // OPTIMIZATION: Re-use the 'booking' object instead of fetching it again.
        User customer = userRepository.findById(booking.getCustomerId()).orElse(null);
        User provider = serviceRepository.findById(booking.getServiceId())
                .flatMap(service -> userRepository.findById(service.getProviderId()))
                .orElse(null);

        if (customer != null && provider != null) {
            User recipient = sender.getId().equals(customer.getId()) ? provider : customer;
            Map<String, Object> notificationPayload = new HashMap<>();
            notificationPayload.put("type", "NEW_CHAT_MESSAGE");
            notificationPayload.put("bookingId", bookingId);
            realTimeService.notifyUser(recipient.getEmail(), notificationPayload);
        }

        return responseDto;
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessagesForBooking(Long bookingId) {
        return chatMessageRepository.findByBookingIdOrderByTimestampAsc(bookingId).stream().map(this::toDto).collect(Collectors.toList());
    }

    private ChatMessageResponse toDto(ChatMessage message) {
        ChatMessageResponse dto = new ChatMessageResponse();
        dto.setId(message.getId());
        dto.setBookingId(message.getBooking().getId());
        dto.setSenderId(message.getSender().getId());
        dto.setSenderName(message.getSender().getName());
        dto.setSenderRole(message.getSenderRole());
        dto.setText(message.getText());
        dto.setTimestamp(message.getTimestamp());
        return dto;
    }
}