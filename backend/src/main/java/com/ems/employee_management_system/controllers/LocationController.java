package com.ems.employee_management_system.controllers;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ems.employee_management_system.dtos.LocationDTO;
import com.ems.employee_management_system.mappers.LocationMapper;
import com.ems.employee_management_system.models.Location;
import com.ems.employee_management_system.services.LocationService;

@RestController
@RequestMapping("/api/locations")
public class LocationController {
    private final LocationService locationService;

    public LocationController(LocationService locationService) {
        this.locationService = locationService;
    }

    @GetMapping
    public List<LocationDTO> getAll() {
        return locationService.getAll().stream()
                .map(LocationMapper::toDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public LocationDTO getById(@PathVariable UUID id) {
        Location location = locationService.getById(id);
        return location != null ? LocationMapper.toDTO(location) : null;
    }

    @PostMapping
    public LocationDTO create(@RequestBody LocationDTO dto) {
        Location location = LocationMapper.toEntity(dto);
        return LocationMapper.toDTO(locationService.save(location));
    }

    @PutMapping("/{id}")
    public LocationDTO update(@PathVariable UUID id, @RequestBody LocationDTO dto) {
        Location location = LocationMapper.toEntity(dto);
        location.setId(id);
        return LocationMapper.toDTO(locationService.save(location));
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        locationService.delete(id);
    }
} 