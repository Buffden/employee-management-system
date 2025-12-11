# Deployment Diagrams

This directory contains deployment diagrams showing the infrastructure and deployment architecture of the Employee Management System.

## What are Deployment Diagrams?

Deployment diagrams show **WHERE** and **HOW** the system is deployed - the physical infrastructure, containers, networks, and deployment processes.

**Purpose**:
- Visualize infrastructure architecture
- Show container orchestration
- Document CI/CD pipelines
- Understand deployment flow
- Plan scaling strategies

## Diagrams

### 1. Docker Architecture
**File**: `docker-architecture.puml`

**Shows**:
- Docker container structure
- Network configuration (ems-network)
- Volume mappings
- Container relationships
- Port mappings

**Use When**:
- Understanding local development setup
- Debugging container issues
- Planning infrastructure changes
- Onboarding new developers

### 2. CI/CD Pipeline
**File**: `ci-cd-pipeline.puml`

**Shows**:
- GitHub Actions CI pipeline
- Jenkins CD pipeline
- Docker image building
- Deployment flow
- Integration with external services

**Use When**:
- Understanding CI/CD workflow
- Debugging pipeline issues
- Planning pipeline improvements
- Documenting deployment process

### 3. Deployment Overview
**File**: `deployment-overview.puml`

**Shows**:
- Development environment
- CI/CD infrastructure
- Production environment
- External services integration
- End-to-end deployment flow

**Use When**:
- High-level architecture overview
- Stakeholder presentations
- Planning deployment strategy
- Understanding system topology

## Security Considerations

**RBAC in Deployment**:
- JWT tokens stored securely (HttpOnly cookies or localStorage)
- HTTPS required in production for token transmission
- Security headers configured in Nginx Gateway
- Database credentials managed via environment variables
- Role-based access enforced at application layer

**See**: `docs/security/roles-and-permissions.md` for RBAC details

## How to View

See main diagrams README for viewing instructions.

---

**Last Updated**: 2024-12-10

