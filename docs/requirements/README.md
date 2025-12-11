# Requirements Documentation

This directory contains functional and non-functional requirements for the Employee Management System.

## Files

- `functional-requirements.md` - Detailed functional requirements
- `non-functional-requirements.md` - Performance, scalability, security requirements

## Overview

The EMS system is designed to:
- Manage employee and department data
- Provide authentication and **Role-Based Access Control (RBAC)** with 4 roles
- Display dashboard metrics and visualizations (role-filtered)
- Support generic table infrastructure (sortable, paginated, filterable)
- Enable CI/CD pipeline (Docker + Jenkins + AWS)

## Security & Authorization

**RBAC Implementation**:
- **4 Roles**: System Admin, HR Manager, Department Manager, Employee
- **Permission Matrix**: See `docs/security/roles-and-permissions.md`
- **Authorization Layers**: Filter → Controller → Service → Repository
- **Field-Level Permissions**: Different roles can modify different fields
- **Data Scope Control**: Department Managers limited to their department, Employees limited to own records

**See**: 
- `functional-requirements.md` Section 4.2 for authorization requirements
- `non-functional-requirements.md` for security requirements
- `docs/security/roles-and-permissions.md` for complete permission matrix

