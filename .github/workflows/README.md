# GitHub Actions Workflows

This directory contains GitHub Actions workflows for continuous integration (CI).

## Workflows

### CI Pipeline (`ci.yml`)

**Purpose**: Automated testing and build verification on every PR and push.

**Triggers**:
- Pull requests to `main`, `develop`, or `master`
- Pushes to `main`, `develop`, or `master`

**Jobs**:

1. **Backend Tests**
   - Sets up PostgreSQL service
   - Runs Maven tests
   - Builds Spring Boot application
   - Validates backend code

2. **Frontend Tests**
   - Sets up Node.js 18
   - Installs dependencies
   - Runs linter
   - Runs Angular tests
   - Builds Angular application

3. **Docker Build Verification**
   - Builds backend Docker image
   - Builds frontend Docker image
   - Builds gateway Docker image
   - Validates Docker configurations

**Benefits**:
- ✅ Automatic validation on every PR
- ✅ Catches issues before merge
- ✅ No infrastructure cost (free for public repos)
- ✅ Fast feedback (typically 5-10 minutes)

## Usage

### Automatic
Workflows run automatically on:
- Every pull request
- Every push to main branches

### Manual Trigger
You can also trigger workflows manually from the GitHub Actions tab.

## Status Badge

Add this to your README.md to show CI status:

```markdown
![CI](https://github.com/Buffden/employee-management-system/workflows/CI%20Pipeline/badge.svg)
```

## Requirements

- Java 17 for backend
- Node.js 18 for frontend
- Docker for build verification
- PostgreSQL 15 for backend tests

All are automatically set up by the workflow.

## Troubleshooting

### Backend Tests Failing
- Check database connection settings
- Verify Maven dependencies
- Check test configuration

### Frontend Tests Failing
- Check Node.js version compatibility
- Verify npm dependencies
- Check Angular test configuration

### Docker Build Failing
- Verify Dockerfile syntax
- Check build context paths
- Verify required files exist

---

**Last Updated**: 2024-12-10

