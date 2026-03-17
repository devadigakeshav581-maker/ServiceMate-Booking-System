package com.servicemate.service;

import com.servicemate.repository.ServiceRepository;
import com.servicemate.repository.model.ServiceItem;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ServiceItemService {

    @Autowired
    private ServiceRepository serviceRepository;

    public List<ServiceItem> getAllServices() {
        return serviceRepository.findAll();
    }

    public ServiceItem getById(Long id) {
        return serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found!"));
    }

    public List<ServiceItem> getByProvider(Long providerId) {
        return serviceRepository.findByProviderId(providerId);
    }

    public ServiceItem createService(ServiceItem service) {
        return serviceRepository.save(service);
    }
}
