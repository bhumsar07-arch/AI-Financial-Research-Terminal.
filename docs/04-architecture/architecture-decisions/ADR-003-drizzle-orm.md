# ADR-003: Drizzle ORM for Data Access and Migrations

* **Status**: Accepted
* **Date**: September 2026

## Context
Interacting with PostgreSQL in Node.js requires a data access layer. Traditional heavyweight ORMs like Prisma or TypeORM introduce complex abstractions, heavy runtime overhead, proprietary query engines, or heavy TypeScript requirements. Writing raw SQL string queries (`pg.query`) lacks schema definition safety and automated migration tracking.

## Decision
We chose **Drizzle ORM** (with `drizzle-kit` for migrations) as the database toolkit for the Express backend.

## Rationale
1. **Lightweight & SQL-Like**: Drizzle provides a thin, intuitive JavaScript API that mirrors SQL semantics (`db.select().from(users).where(...)`), keeping queries transparent and easy to debug.
2. **First-Class JavaScript Support**: Works seamlessly in modern vanilla JavaScript (ESM) without demanding TypeScript compilation steps.
3. **Robust Migration CLI**: `drizzle-kit` generates clean, auditable SQL migration files from schema definitions, ensuring reproducible schema deployments across environments.
4. **Vector Support**: Supports custom and native column types, making it straightforward to define vector embedding columns.

## Consequences
* **Positive**: Fast runtime performance, zero binary engine overhead, clear and inspectable SQL migrations.
* **Negative**: Slightly newer than older ORMs, requiring understanding of its modular schema syntax.
