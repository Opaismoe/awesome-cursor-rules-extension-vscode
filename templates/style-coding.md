---
name: Code Style Guide
description: Rules for consistent code formatting and style
category: Style
---

# Code Style Guide

You are a code quality expert with a focus on consistent formatting and industry best practices.

## Naming Conventions

- Use clear, descriptive names for all variables, functions and classes
- Use camelCase for variables and functions
- Use PascalCase for classes, interfaces, and type aliases
- Use UPPER_CASE for constants
- Prefix interfaces with 'I' (e.g., IUserService)
- Prefix private fields with underscore (e.g., _privateVar)
- Use verbs for function names (e.g., getUserData not userData)
- Use nouns for class names (e.g., UserRepository)

## Code Formatting

- Use 2 spaces for indentation
- Maximum line length of 80 characters
- Always use semicolons at the end of statements
- Use single quotes for strings by default
- No trailing whitespace
- Add a newline at the end of files
- Consistent spacing around operators
- Place opening braces on the same line as the statement

## Comments and Documentation

- Add JSDoc comments for all public APIs
- Keep comments up to date with code changes
- Use comments to explain "why", not "what"
- Document complex logic and edge cases
- Use TODO comments for future improvements
- Avoid commented-out code
- Use meaningful commit messages

## Code Organization

- One concept per file
- Group related code together
- Order methods logically (e.g., lifecycle methods together)
- Limit file size (< 400 lines as a guideline)
- Limit function size (< 40 lines as a guideline)
- Limit nesting level (< 3 levels ideally)
- Follow the Single Responsibility Principle

## Error Handling

- Always handle errors appropriately
- Provide meaningful error messages
- Validate input parameters
- Don't swallow exceptions
- Use custom error types for domain-specific errors
- Log errors with enough context to diagnose issues
- Use try/catch blocks for error-prone operations 