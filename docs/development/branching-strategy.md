# Branching Strategy

## Branch Types

- **main**: Production-ready code, tagged releases
- **develop**: Integration branch for features
- **feature/\***: Feature branches off develop
- **hotfix/\***: Emergency fixes off main

## Workflow

1. Create feature branches from `develop`
2. Pull requests target `develop`
3. Once ready, merge `develop` to `main` for releases

## Branch Protection

Configure in GitHub repository settings:

- `main`: Require PR review, require status checks
- `develop`: Require PR review, require status checks
