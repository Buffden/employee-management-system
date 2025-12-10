package com.ems.employee_management_system.services;

import com.ems.employee_management_system.models.Location;
import com.ems.employee_management_system.repositories.LocationRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class LocationService {
    private final LocationRepository locationRepository;

    public LocationService(LocationRepository locationRepository) {
        this.locationRepository = locationRepository;
    }

    public List<Location> getAll() {
        return locationRepository.findAll();
    }

    public Location getById(UUID id) {
        return locationRepository.findById(id).orElse(null);
    }

    public Location save(Location location) {
        return locationRepository.save(location);
    }

    public void delete(UUID id) {
        locationRepository.deleteById(id);
    }
} 