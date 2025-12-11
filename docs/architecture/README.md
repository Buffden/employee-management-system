# Architecture Documentation

This directory contains high-level architecture documentation for the Employee Management System.

## Files

- `system-overview.md` - Overall system architecture and components
- `backend-architecture.md` - Backend layer architecture and design
- `frontend-architecture.md` - Frontend architecture and component structure
- `deployment-architecture.md` - Deployment architecture (Docker, AWS, CI/CD)

## Architecture Principles

1. **Layered Architecture**: Clear separation of concerns (Controller → Service → Repository)
2. **Microservices Ready**: Stateless services for horizontal scaling
3. **Design Patterns**: Systematic application of GoF patterns
4. **Cloud-Native**: Built for cloud deployment (AWS)
5. **Container-First**: Docker-based development and deployment
6. **Security-First**: Role-Based Access Control (RBAC) with 4-layer security architecture

## Security & Authorization

The system implements comprehensive RBAC:
- **4 Roles**: System Admin, HR Manager, Department Manager, Employee
- **4-Layer Security**: Filter → Controller → Service → Repository
- **JWT Authentication**: Stateless token-based authentication
- **Method-Level Security**: `@PreAuthorize` annotations for authorization

**See**: 
- `system-overview.md` for security architecture details
- `docs/security/roles-and-permissions.md` for complete permission matrix
- `docs/lld/auth-module.md` for RBAC implementation details

