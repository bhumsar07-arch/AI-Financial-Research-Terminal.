# ADR-006: Stateless JWT Authentication with Password Hashing

* **Status**: Accepted
* **Date**: September 2026

## Context
The application requires user identity verification to manage user-specific resources (watchlists, chat history, custom notes). We need an authentication strategy that is secure, industry-standard, and simple to implement in a decoupled architecture.

## Decision
We chose **Stateless JSON Web Tokens (JWT)** for authentication, coupled with `bcrypt` for one-way password hashing on registration and login.

## Rationale
1. **Stateless Scalability**: The Express backend verifies incoming requests using the cryptographically signed JWT without querying a server-side session store on every API hit.
2. **Decoupled Architecture Friendly**: The Bearer token pattern allows the client to send tokens in standard `Authorization: Bearer <token>` HTTP headers.
3. **Cryptographic Security**: Passwords are salted and hashed using `bcrypt` with work factor 10, protecting against rainbow table and brute force attacks. Password hashes are never returned in responses.
4. **Pedagogical Value**: Learning how JWT signing, verification, claims (`sub`, `email`, `exp`), and middleware interception work is essential knowledge for modern web developers.

## Consequences
* **Positive**: Fast, stateless verification; no Redis session cache required for local development.
* **Negative**: Tokens cannot be easily revoked before expiration without maintaining a blacklist; mitigated by setting reasonable token lifespans (e.g., 24 hours).
