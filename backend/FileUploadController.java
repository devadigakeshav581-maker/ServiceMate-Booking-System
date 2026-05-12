package com.servicemate.controller;

import com.servicemate.service.StorageService;
import com.servicemate.repository.ServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
public class FileUploadController {

    private final StorageService storageService;
    private final ServiceRepository serviceRepository;

    @PostMapping("/{id}/upload-image")
    public ResponseEntity<?> uploadImage(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        return serviceRepository.findById(id)
                .map(service -> {
                    String imageUrl = storageService.store(file);
                    service.setImageUrl(imageUrl); // Save the image URL to the service item
                    serviceRepository.save(service); // Persist the updated service item
                    return ResponseEntity.ok(Map.of("imageUrl", imageUrl));
                }).orElse(ResponseEntity.notFound().build());
    }
}