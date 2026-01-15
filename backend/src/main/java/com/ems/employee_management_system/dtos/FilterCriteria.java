package com.ems.employee_management_system.dtos;

import java.util.List;
import java.util.Map;

public class FilterCriteria {
    private String field;
    private String operator;  // "equals", "in", "like", etc
    private List<?> values;   // Can be String or Map<String, String> with id/label

    public FilterCriteria() {
    }

    public FilterCriteria(String field, String operator, List<?> values) {
        this.field = field;
        this.operator = operator;
        this.values = values;
    }

    public String getField() {
        return field;
    }

    public void setField(String field) {
        this.field = field;
    }

    public String getOperator() {
        return operator;
    }

    public void setOperator(String operator) {
        this.operator = operator;
    }

    public List<?> getValues() {
        return values;
    }

    public void setValues(List<?> values) {
        this.values = values;
    }
}