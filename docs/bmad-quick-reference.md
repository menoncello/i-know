# BMAD Quick Reference - I Know Project

## Project Overview

**I Know** is an entertainment intelligence platform built with:
- **Runtime**: Bun 1.3.1+
- **Language**: TypeScript 5.9.3 (Strict mode)
- **Frontend**: Astro 5.12.0 + React 19.2.0 + Tailwind CSS 4.1.16
- **Backend**: Elysia 1.4.13 + PostgreSQL 18.0
- **Testing**: Bun Test (unit/integration) + Playwright (E2E)

## Quality Gates (MANDATORY - Zero Tolerance)

- **TypeScript**: 0 compilation errors (strict mode)
- **ESLint**: 0 validation errors (no eslint-disable allowed)
- **Tests**: 100% pass rate (Bun Test + Playwright)
- **Formatting**: 100% compliance (Prettier)
- **Anti-patterns**: NO eslint-disable, NO @ts-ignore, NO @ts-expect-error

## Story Loop

```bash
# 1. Planning
/bmad:bmm:agents:pm
*product-brief              # Generate product brief
*prd                       # Generate PRD from brief

# 2. Architecture
/bmad:bmm:agents:architect
*solution-architecture     # Generate architecture decisions
*tech-spec                 # Generate technical specifications

# 3. Story Creation
/bmad:bmm:agents:sm
*create-story              # Create user stories with acceptance criteria
*story-context             # Generate technical context and mark ready
*story-ready               # Mark drafted stories as ready (no context)

# 4. Implementation
/bmad:bmm:agents:dev
*develop                   # Implement story (quality gates enforced automatically)

# Quality Gates (Automatic - ZERO TOLERANCE)
- TypeScript: 0 errors (strict mode)
- ESLint: 0 errors (no eslint-disable allowed)
- Tests: 100% pass rate
- Formatting: 100% compliance
```

## Quality Checks

```bash
# 4. Quality Checks (Automatic during development)
/bmad:bmm:agents:dev
*develop                   # Quality gates run automatically

/bmad:bmm:agents:tea
*test-review               # Review test quality
*framework                 # Initialize test framework
*atdd                      # Generate E2E tests first
*automate                  # Generate comprehensive test automation

# Test Stack
- Unit/Integration: Bun Test (describe, it, expect)
- E2E: Playwright (test, expect, page)
- Quality Gates: TypeScript 0, ESLint 0, Tests 100%
```

## Code Review

```bash
# Review Process
/bmad:bmm:agents:dev
*review                    # Code review implementation
```

## Sprint Management

```bash
# Sprint Planning and Status
/bmad:bmm:agents:sm
*sprint-planning           # Generate sprint status and stories
*workflow-status           # Check workflow status
```

## Test Architecture

```bash
# Test Design and Validation
/bmad:bmm:agents:tea
*test-design               # Create comprehensive test scenarios
*test-review               # Review test quality
*nfr-assess                # Validate non-functional requirements
*ci                        # Scaffold CI/CD quality pipeline
```

## Tips

- **Quality Gates are MANDATORY** - TypeScript 0 errors, ESLint 0 errors, Tests 100%, no eslint-disable
- **Never use @ts-ignore** - Fix underlying type issues
- **All code examples must be production-ready** - They must compile and lint
- **Story templates demonstrate correct patterns** - Copy-paste ready examples
- **Use Bun Test API** - Not Jest or Vitest patterns
- **Use Playwright for E2E** - Proper page object patterns
- **Strict TypeScript mode** - No any types allowed
- **Prettier formatting** - Consistent code style enforced

## Workflow Commands

```bash
# Check current status
/bmad:bmm:agents:sm
*workflow-status           # Current sprint status and next actions

# Quick actions
/bmad:bmm:agents:sm
*create-story              # Quick story creation
*story-ready               # Mark story ready for development

# Development
/bmad:bmm:agents:dev
*develop                   # Full story implementation with quality gates
```

## Quality Enforcement

All BMAD agents are personalized to enforce this project's quality standards:

- **DEV Agent**: Zero-tolerance quality gates, fixes underlying issues
- **Architect Agent**: Code examples must compile and lint
- **SM Agent**: Story templates are production-ready
- **TEA Agent**: Generated tests meet quality standards
- **Workflows**: Quality validation is mandatory, not optional

## Getting Started

```bash
# 1. Initialize project (if not already done)
/bmad:bmm:agents:sm
*sprint-planning           # Create initial sprint structure

# 2. Create first story
/bmad:bmm:agents:sm
*create-story              # Create user stories

# 3. Generate context and mark ready
/bmad:bmm:agents:sm
*story-context             # Generate technical context

# 4. Implement story
/bmad:bmm:agents:dev
*develop                   # Implement with automatic quality gates
```

---

*This quick reference is specific to the I Know project. All agents and workflows are personalized for this project's technology stack and quality standards.*