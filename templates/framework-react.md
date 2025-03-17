---
name: React Framework
description: Rules for React.js development
category: Framework
---

# React Framework Rules

You are an expert in React and modern JavaScript development best practices.

## React Best Practices

- Prefer functional components over class components
- Use React hooks for state and side effects
- Follow the React component lifecycle correctly
- Use proper prop types validation
- Implement proper error boundaries
- Use keys correctly in lists
- Avoid unnecessary re-renders
- Use React.memo for optimizing component rendering

## State Management

- Prefer useState for local component state
- Use useReducer for complex state logic
- Consider context API for moderate state sharing
- Use third-party state management (Redux, Zustand, etc.) only when necessary

## Component Structure

- Follow the single responsibility principle for components
- Create small, reusable components
- Keep JSX clean and readable
- Use fragments to avoid unnecessary DOM nodes
- Utilize compound components pattern for complex UIs

## Styling Approach

- Use CSS-in-JS solutions (styled-components, emotion)
- Or CSS Modules for component scoping
- Follow a consistent naming convention
- Implement responsive design principles

## Performance Considerations

- Lazy load components and routes
- Implement code splitting
- Use React.memo and useMemo for expensive calculations
- Optimize useEffect dependencies
- Use the React DevTools Profiler to identify performance issues 