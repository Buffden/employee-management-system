package com.ems.employee_management_system.utils;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.jpa.domain.Specification;

import com.ems.employee_management_system.dtos.FilterCriteria;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Utility class for building JPA Specifications from FilterCriteria
 * Supports: equals, in, like, range, gt, lt, exists operators
 * Values can be either String or Map<String, String> with id/label properties
 */
public class FilterBuilder {
    private static final Logger logger = LoggerFactory.getLogger(FilterBuilder.class);

    /**
     * Build a JPA Specification for a single filter criterion
     * Supports nested paths (e.g., "department.name", "location.city")
     */
    public static <T> Specification<T> buildSpecification(FilterCriteria filter) {
        return (root, query, cb) -> {
            if (filter == null || filter.getField() == null || filter.getValues() == null || filter.getValues().isEmpty()) {
                return cb.conjunction(); // Return true condition if filter is empty
            }

            String field = filter.getField();
            List<?> rawValues = filter.getValues();
            String operator = deriveOperator(rawValues);
            
            // Convert raw values to strings for processing, extracting id/label info for logging
            List<String> values = convertRawValuesToStrings(rawValues);
            String valuesSummary = summarizeValuesWithLabels(rawValues);

            logger.info("Filter trace: applying field='{}', operator='{}', values={}", field, operator, valuesSummary);
            logger.debug("Building specification - Field: {}, Operator: {}, Values: {}", field, operator, values);

            try {
                switch (operator) {
                    case "equals":
                        logger.debug("Building equals predicate for field: {} with value: {}", field, values.get(0));
                        return buildEqualsPredicate(root, cb, field, values.get(0));

                    case "in":
                        logger.debug("Building in predicate for field: {} with values: {}", field, values);
                        return buildInPredicate(root, cb, field, values);

                    case "like":
                        return buildLikePredicate(root, cb, field, values.get(0));

                    case "starts_with":
                        return buildStartsWithPredicate(root, cb, field, values.get(0));

                    case "ends_with":
                        return buildEndsWithPredicate(root, cb, field, values.get(0));

                    case "range":
                        return buildRangePredicate(root, cb, field, values);

                    case "gt":
                        return buildGreaterThanPredicate(root, cb, field, values.get(0));

                    case "lt":
                        return buildLessThanPredicate(root, cb, field, values.get(0));

                    case "exists":
                        return buildExistsPredicate(root, cb, field);

                    case "not_equals":
                        return buildNotEqualsPredicate(root, cb, field, values.get(0));

                    case "not_in":
                        return buildNotInPredicate(root, cb, field, values);

                    case "not_like":
                        return buildNotLikePredicate(root, cb, field, values.get(0));

                    default:
                        return cb.conjunction(); // Default: return true
                }
            } catch (Exception e) {
                // Log the error and return true condition to not break query
                logger.error("Error building filter for field '{}' with operator '{}': {}", field, operator, e.getMessage(), e);
                return cb.conjunction();
            }
        };
    }

    private static String deriveOperator(List<?> rawValues) {
        if (rawValues == null || rawValues.isEmpty()) {
            return "equals";
        }
        return rawValues.size() > 1 ? "in" : "equals";
    }

    /**
     * Build equals predicate - handles UUID and String types
     */
    private static <T> Predicate buildEqualsPredicate(Root<T> root, CriteriaBuilder cb, String field, String value) {
        var fieldPath = getPath(root, field);
        
        // Try to convert to UUID if field type is UUID
        if (isUUID(value)) {
            try {
                return cb.equal(fieldPath, UUID.fromString(value));
            } catch (Exception e) {
                // Fall through to string comparison
            }
        }
        
        // Case-insensitive string comparison
        // Cast to String type for case-insensitive operations
        jakarta.persistence.criteria.Expression<String> stringPath = fieldPath.as(String.class);
        return cb.equal(cb.lower(stringPath), value.toLowerCase());
    }

    /**
     * Build IN predicate - handles multiple values
     */
    private static <T> Predicate buildInPredicate(Root<T> root, CriteriaBuilder cb, String field, List<String> values) {
        var fieldPath = getPath(root, field);
        
        // Check if values are UUIDs
        if (!values.isEmpty() && isUUID(values.get(0))) {
            try {
                List<UUID> uuids = values.stream()
                        .map(UUID::fromString)
                        .toList();
                return fieldPath.in(uuids);
            } catch (Exception e) {
                // Fall through to string comparison
            }
        }
        
        // String comparison
        List<String> lowerValues = values.stream()
                .map(String::toLowerCase)
                .toList();
        return cb.lower(fieldPath.as(String.class)).in(lowerValues);
    }

    /**
     * Build LIKE predicate (contains)
     */
    private static <T> Predicate buildLikePredicate(Root<T> root, CriteriaBuilder cb, String field, String value) {
        var fieldPath = getPath(root, field);
        return cb.like(cb.lower(fieldPath.as(String.class)), "%" + value.toLowerCase() + "%");
    }

    /**
     * Build STARTS WITH predicate
     */
    private static <T> Predicate buildStartsWithPredicate(Root<T> root, CriteriaBuilder cb, String field, String value) {
        var fieldPath = getPath(root, field);
        return cb.like(cb.lower(fieldPath.as(String.class)), value.toLowerCase() + "%");
    }

    /**
     * Build ENDS WITH predicate
     */
    private static <T> Predicate buildEndsWithPredicate(Root<T> root, CriteriaBuilder cb, String field, String value) {
        var fieldPath = getPath(root, field);
        return cb.like(cb.lower(fieldPath.as(String.class)), "%" + value.toLowerCase());
    }

    /**
     * Build RANGE predicate (between) - expects two values [start, end]
     */
    private static <T> Predicate buildRangePredicate(Root<T> root, CriteriaBuilder cb, String field, List<String> values) {
        if (values.size() < 2) {
            return cb.conjunction();
        }

        var fieldPath = getPath(root, field);
        String start = values.get(0);
        String end = values.get(1);

        // Try to parse as comparable values (dates, numbers)
        try {
            // Assuming ISO date format or numeric
            return cb.between(fieldPath.as(String.class), start, end);
        } catch (Exception e) {
            return cb.conjunction();
        }
    }

    /**
     * Build GREATER THAN predicate
     */
    private static <T> Predicate buildGreaterThanPredicate(Root<T> root, CriteriaBuilder cb, String field, String value) {
        var fieldPath = getPath(root, field);
        try {
            return cb.greaterThan(fieldPath.as(String.class), value);
        } catch (Exception e) {
            return cb.conjunction();
        }
    }

    /**
     * Build LESS THAN predicate
     */
    private static <T> Predicate buildLessThanPredicate(Root<T> root, CriteriaBuilder cb, String field, String value) {
        var fieldPath = getPath(root, field);
        try {
            return cb.lessThan(fieldPath.as(String.class), value);
        } catch (Exception e) {
            return cb.conjunction();
        }
    }

    /**
     * Build EXISTS (IS NOT NULL) predicate
     */
    private static <T> Predicate buildExistsPredicate(Root<T> root, CriteriaBuilder cb, String field) {
        var fieldPath = getPath(root, field);
        return cb.isNotNull(fieldPath);
    }

    /**
     * Build NOT EQUALS predicate
     */
    private static <T> Predicate buildNotEqualsPredicate(Root<T> root, CriteriaBuilder cb, String field, String value) {
        var fieldPath = getPath(root, field);
        
        if (isUUID(value)) {
            try {
                return cb.notEqual(fieldPath, UUID.fromString(value));
            } catch (Exception e) {
                // Fall through
            }
        }
        
        return cb.notEqual(cb.lower(fieldPath.as(String.class)), value.toLowerCase());
    }

    /**
     * Build NOT IN predicate
     */
    private static <T> Predicate buildNotInPredicate(Root<T> root, CriteriaBuilder cb, String field, List<String> values) {
        var fieldPath = getPath(root, field);
        
        if (!values.isEmpty() && isUUID(values.get(0))) {
            try {
                List<UUID> uuids = values.stream()
                        .map(UUID::fromString)
                        .toList();
                return fieldPath.in(uuids).not();
            } catch (Exception e) {
                // Fall through
            }
        }
        
        List<String> lowerValues = values.stream()
                .map(String::toLowerCase)
                .toList();
        return cb.lower(fieldPath.as(String.class)).in(lowerValues).not();
    }

    /**
     * Build NOT LIKE predicate
     */
    private static <T> Predicate buildNotLikePredicate(Root<T> root, CriteriaBuilder cb, String field, String value) {
        var fieldPath = getPath(root, field);
        return cb.notLike(cb.lower(fieldPath.as(String.class)), "%" + value.toLowerCase() + "%");
    }

    /**
     * Get path for nested fields (e.g., "department.name")
     */
    @SuppressWarnings("unchecked")
    private static <T> jakarta.persistence.criteria.Path getPath(Root<T> root, String field) {
        if (field.contains(".")) {
            String[] parts = field.split("\\.");
            var path = root.get(parts[0]);
            for (int i = 1; i < parts.length; i++) {
                path = path.get(parts[i]);
            }
            return path;
        }
        return root.get(field);
    }

    /**
     * Check if a string is a valid UUID
     */
    private static boolean isUUID(String value) {
        try {
            UUID.fromString(value);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Convert raw filter values (which can be String or Map) to List<String>
     * Extracts the 'id' field from Map objects, or keeps String values as-is
     */
    private static List<String> convertRawValuesToStrings(List<?> rawValues) {
        return rawValues.stream()
                .map(v -> {
                    if (v instanceof String) {
                        return (String) v;
                    } else if (v instanceof Map) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> map = (Map<String, Object>) v;
                        Object id = map.get("id");
                        return id != null ? id.toString() : v.toString();
                    } else {
                        return v.toString();
                    }
                })
                .collect(Collectors.toList());
    }

    /**
     * Create a human-readable summary of filter values including labels for logging
     * Shows both id and label when available: "id1 (label1) | id2 (label2)"
     */
    private static String summarizeValuesWithLabels(List<?> rawValues) {
        return rawValues.stream()
                .map(v -> {
                    if (v instanceof String) {
                        return (String) v;
                    } else if (v instanceof Map) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> map = (Map<String, Object>) v;
                        Object id = map.get("id");
                        Object label = map.get("label");
                        if (id != null && label != null) {
                            return id + " (" + label + ")";
                        } else if (id != null) {
                            return id.toString();
                        } else {
                            return v.toString();
                        }
                    } else {
                        return v.toString();
                    }
                })
                .collect(Collectors.joining(", "));
    }
}
