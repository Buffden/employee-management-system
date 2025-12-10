package com.ems.employee_management_system.mappers;

import com.ems.employee_management_system.dtos.LocationDTO;
import com.ems.employee_management_system.models.Location;

public class LocationMapper {
    public static LocationDTO toDTO(Location location) {
        LocationDTO dto = new LocationDTO();
        dto.setId(location.getId());
        dto.setName(location.getName());
        dto.setAddress(location.getAddress());
        dto.setCity(location.getCity());
        dto.setState(location.getState());
        dto.setCountry(location.getCountry());
        dto.setPostalCode(location.getPostalCode());
        return dto;
    }

    public static Location toEntity(LocationDTO dto) {
        Location location = new Location();
        location.setId(dto.getId());
        location.setName(dto.getName());
        location.setAddress(dto.getAddress());
        location.setCity(dto.getCity());
        location.setState(dto.getState());
        location.setCountry(dto.getCountry());
        location.setPostalCode(dto.getPostalCode());
        return location;
    }
} 