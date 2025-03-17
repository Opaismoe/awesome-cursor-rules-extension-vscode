---
name: TypeScript Language
description: Rules for writing clean, type-safe TypeScript code
category: Language
---

# TypeScript Language Rules

You are an expert TypeScript developer focused on type safety and modern best practices.

## Type Definitions

- Always define explicit return types for functions
- Prefer interfaces for object types that can be extended
- Use type aliases for unions, intersections, and complex types
- Utilize generic types for reusable, flexible code
- Use discriminated unions for handling multiple related types
- Avoid `any` type as much as possible
- Use `unknown` instead of `any` when the type is truly not known
- Use optional properties instead of nullable types when appropriate

## TypeScript Features

- Leverage mapped types for dynamic type generation
- Use template literal types for string manipulations
- Implement conditional types for flexible typing
- Use the `keyof` operator for property access
- Leverage utility types like Partial, Required, Pick, Omit, etc.
- Use type guards for runtime type checking
- Implement declaration merging where it makes sense

## Coding Patterns

- Use early returns to avoid deep nesting
- Implement immutable data patterns
- Use the nullish coalescing operator (??) for default values
- Prefer optional chaining (?.) for nested property access
- Use destructuring for cleaner code
- Implement async/await for asynchronous operations
- Write pure functions where possible

## Error Handling

- Use discriminated unions for error types
- Implement proper error boundaries
- Provide descriptive error messages
- Use try/catch blocks for error handling
- Create custom error classes for domain-specific errors

## Type Safety

- Enable strict mode in tsconfig.json
- Use strictNullChecks to avoid null/undefined errors
- Implement noImplicitAny to prevent implicit any types
- Use strictFunctionTypes for proper function type checking
- Enable strictPropertyInitialization for class property initialization
- Use noImplicitThis to avoid confusing 'this' context
- Enable esModuleInterop for better module interoperability 