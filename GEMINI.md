## Project Context

Ultracite enforces strict type safety, accessibility standards, and consistent code quality for JavaScript/TypeScript projects using Biome.


## Before Writing Code

1. Analyze existing patterns in the codebase  
2. Consider edge cases and error scenarios  
3. Follow all rules strictly  
4. Validate accessibility requirements  

---

## Commands

- `pnpm dlx ultracite fix`
- `pnpm dlx ultracite check`
- `pnpm dlx ultracite doctor`

---

# RULES (STRICT)

## Accessibility (a11y)

- Don't use `accessKey`
- Don't set `aria-hidden="true"` on focusable elements
- Don't add unsupported ARIA roles, states, or properties
- Don't use `<marquee>` or `<blink>`
- Only use `scope` on `<th>`
- Don't assign non-interactive roles to interactive elements
- Ensure labels have text and are linked to inputs
- Don't assign interactive roles to non-interactive elements
- Don't use `tabIndex` on non-interactive elements
- Don't use positive `tabIndex`
- Don't include redundant words in alt text (image, photo, etc.)
- Don't duplicate implicit roles
- Static clickable elements must have valid roles
- Always include `<title>` in SVG
- Provide meaningful alt text
- Anchors must be accessible
- Include required ARIA attributes
- Use valid ARIA values only
- Always include button `type`
- Interactive elements must be focusable
- Headings must be readable (not hidden)
- Always include `<html lang="">`
- Always include `iframe` title
- Pair `onClick` with keyboard handlers
- Pair hover with focus
- Include captions for media
- Prefer semantic elements over ARIA
- Ensure anchors are valid
- Use valid autocomplete values
- Use correct ISO lang codes

---

## Code Quality & Complexity

- Don't use `arguments`
- Don't use comma operator
- Don't use empty type params
- Avoid high cognitive complexity
- Avoid deep nesting
- Don't use unnecessary boolean casts
- Don't use unnecessary callbacks
- Use `for...of`
- Don't create static-only classes
- Don't misuse `this` or `super`
- Don't use unnecessary catch blocks
- Don't use unnecessary constructors
- Don't use unnecessary `continue`
- Don't export empty modules
- Don't use unnecessary regex escapes
- Don't use unnecessary fragments
- Don't use unnecessary labels
- Don't use unnecessary nested blocks
- Don't rename to same name
- Don't use unnecessary string concat
- Don't use useless switch cases
- Avoid unnecessary ternaries
- Don't alias `this`
- Don't use `any` constraints
- Don't initialize to undefined
- Don't use `void`
- Prefer arrow functions
- Use `Date.now()`
- Prefer `.flatMap()`
- Prefer literal property access
- Prefer regex literals
- Remove redundant logic
- Prefer `while` if simpler
- Don't pass children as props
- Don't reassign `const`

---

## React & JSX

- Don't use React.render return value
- Hooks must have correct deps
- Hooks at top level only
- Use keys in lists (no index)
- Don't define components inside components
- Don't attach handlers to non-interactive elements
- Don't mutate props
- Don't mix children and dangerouslySetInnerHTML
- Don't use dangerous props
- Don't duplicate JSX props
- Use fragments shorthand
- Avoid invalid JSX syntax

---

## Correctness & Safety

- No self-assignment
- No returning from setters
- No invalid comparisons
- No undeclared variables
- No unreachable code
- Ensure correct `super()` usage
- No control flow in finally
- No invalid optional chaining
- No unused variables/imports
- No unused labels
- No unused class members
- No void returns in void functions
- Use `isNaN` correctly
- Ensure loop correctness
- Ensure typeof correctness
- Generators must yield
- No `await` in loops
- No bitwise operators
- No useless expressions
- Handle promises properly
- No __dirname misuse
- Prevent import cycles
- No hardcoded secrets
- No shadowing variables
- No `@ts-ignore`
- No useless regex
- No useless undefined
- Group getters/setters
- Use object spread
- Always use radix in parseInt

---

## TypeScript

- Don't use enums
- Don't export imports
- Avoid unnecessary annotations
- Don't use namespaces
- Don't use non-null assertions
- Don't use parameter properties
- Use `as const`
- Use `import type`
- Avoid `any`
- Avoid implicit any
- Don't merge interfaces unsafely

---

## Style & Consistency

- Don't use eval
- Don't use async callbacks in tests
- Avoid negated if with else
- Avoid nested ternaries
- Don't reassign params
- Prefer `slice()` over substring
- Avoid unnecessary templates
- Avoid `else` after return
- Avoid yoda conditions
- Avoid Array constructor
- Use `at()` for indexing
- Use `else if`
- Use `const`
- Include default in switch
- Use `**` instead of Math.pow
- Use `node:` imports
- Use assignment shorthand
- Throw Error objects
- No console/debugger
- Use strict equality

---

## Security

- Add `rel="noopener"` with `_blank`
- Avoid `dangerouslySetInnerHTML`
- Don't use eval
- Sanitize inputs

---

## Performance

- Avoid spreads in loops
- Use top-level regex
- Avoid namespace imports
- Avoid barrel files

---

## Framework Rules

### Next.js
- Don't use `<img>`
- Don't use `<head>`
- Follow Next.js conventions

---

## Testing

- No exports in tests
- No focused tests
- Assertions inside test blocks
- No disabled tests

---

# GUIDANCE (NON-STRICT)

## General

- Prefer clarity over cleverness  
- Use descriptive naming  
- Handle edge cases  
- Keep functions small  
- Favor explicitness  

## Architecture

- Separate concerns  
- Keep components modular  
- Avoid over-abstraction  

## Error Handling

- Use meaningful error messages  
- Fail loudly and clearly  

## Final Rule

If something feels clever → simplify it  
If something feels implicit → make it explicit  


# Ultracite Code Standards

This project uses **Ultracite**, a zero-config preset that enforces strict code quality standards through automated formatting and linting.

## Quick Reference

- **Format code**: `pnpm dlx ultracite fix`
- **Check for issues**: `pnpm dlx ultracite check`
- **Diagnose setup**: `pnpm dlx ultracite doctor`

Biome (the underlying engine) provides robust linting and formatting. Most issues are automatically fixable.

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors

### React & JSX

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags instead of passing as props
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility:
  - Provide meaningful alt text for images
  - Use proper heading hierarchy
  - Add labels for form inputs
  - Include keyboard event handlers alongside mouse events
  - Use semantic elements (`<button>`, `<nav>`, etc.) instead of divs with roles

### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases

### Code Organization

- Keep functions focused and under reasonable cognitive complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together and separate concerns

### Security

- Add `rel="noopener"` when using `target="_blank"` on links
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)
- Use proper image components (e.g., Next.js `<Image>`) over `<img>` tags

### Framework-Specific Guidance

**Next.js:**
- Use Next.js `<Image>` component for images
- Use `next/head` or App Router metadata API for head elements
- Use Server Components for async data fetching instead of async Client Components

**React 19+:**
- Use ref as a prop instead of `React.forwardRef`

**Solid/Svelte/Vue/Qwik:**
- Use `class` and `for` attributes (not `className` or `htmlFor`)

---

## Testing

- Write assertions inside `it()` or `test()` blocks
- Avoid done callbacks in async tests - use async/await instead
- Don't use `.only` or `.skip` in committed code
- Keep test suites reasonably flat - avoid excessive `describe` nesting

## When Biome Can't Help

Biome's linter will catch most issues automatically. Focus your attention on:

1. **Business logic correctness** - Biome can't validate your algorithms
2. **Meaningful naming** - Use descriptive names for functions, variables, and types
3. **Architecture decisions** - Component structure, data flow, and API design
4. **Edge cases** - Handle boundary conditions and error states
5. **User experience** - Accessibility, performance, and usability considerations
6. **Documentation** - Add comments for complex logic, but prefer self-documenting code

---

Most formatting and common issues are automatically fixed by Biome. Run `pnpm dlx ultracite fix` before committing to ensure compliance.
