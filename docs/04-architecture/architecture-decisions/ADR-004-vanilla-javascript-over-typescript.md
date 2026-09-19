# ADR-004: Standard Modern JavaScript (ESM) Over TypeScript

* **Status**: Accepted
* **Date**: September 2026

## Context
When architecting full-stack JavaScript applications, developers frequently debate whether to use TypeScript or JavaScript. The developer on this project is a beginner-to-intermediate student building a comprehensive portfolio application while learning full-stack concepts.

## Decision
We chose **Standard Modern JavaScript (ES Modules)** for both the React frontend and Express backend. TypeScript is explicitly excluded.

## Rationale
1. **Focus on Core Architecture**: Eliminating TypeScript prevents the developer from getting bogged down in complex type gymnastics, generics, type definition mismatches, and build transpilations (`tsc`, tsconfig paths).
2. **Faster Feedback Loop**: Native ESM code runs directly in Node.js (with `"type": "module"`) and Vite without compilation friction.
3. **Clarity of Mental Model**: Learning how Express middleware, PostgreSQL connections, JWT authentication, and React state work is much clearer in vanilla JavaScript.
4. **Clean Code Still Enforced**: Code quality is maintained through clear naming, JSDoc annotations where helpful, schema validation (e.g. Zod/Joi), and modular architecture.

## Consequences
* **Positive**: Rapid feature iteration, zero compilation errors, pure understanding of runtime behavior.
* **Negative**: Lack of compile-time type checking; compensated by thorough API schema validation and test cases.
