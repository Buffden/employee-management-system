package com.ems.employee_management_system.dtos;

import java.util.List;
public class FilterCriteria {
    private String field;
    private List<?> values;   // Can be String or Map<String, String> with id/label

    public FilterCriteria() {
    }

    public FilterCriteria(String field, List<?> values) {
        this.field = field;
        this.values = values;
    }

    public String getField() {
        return field;
    }

    public void setField(String field) {
        this.field = field;
    }

    public List<?> getValues() {
        return values;
    }

    public void setValues(List<?> values) {
        this.values = values;
    }
}