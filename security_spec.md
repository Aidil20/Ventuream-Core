# Security Specification - Role Management System

## Data Invariants
1. A User document must have a `role` field restricted to valid institutional roles.
2. Only `President_Director` can change any user's role.
3. Users can only read their own profile, unless they are `President_Director` or `Manager` (who can see all profiles for governance).
4. Users cannot change their own `role` or `uid`.

## The "Dirty Dozen" Payloads (Failed Cases)
1. **Self-Promotion**: Authenticated user trying to update their own role to `President_Director`.
2. **Identity Spoofing**: Creating a user record with a different `uid` than the authenticated user.
3. **Ghost Field Injection**: Adding `isAdmin: true` to a user document.
4. **Manager Privilege Escalation**: A `Manager` trying to promote someone to `President_Director`.
5. **Public Data Scraping**: A `Public` user trying to list all user emails.
6. **Immutable Field Tampering**: Trying to change `uid` or `email` after creation.
7. **Resource Poisoning**: Injecting a 1MB string into the `displayName`.
8. **Invalid Role Injection**: Setting role to `SuperAdmin` (not in enum).
9. **Orphaned Profile**: Creating a profile without a corresponding Auth UID (handled by rules).
10. **State Shortcut**: Changing `updatedAt` to a past timestamp (must be `request.time`).
11. **PII Leak**: Unauthorized read of another user's email.
12. **Unverified Auth**: Accessing/writing data with `email_verified: false`.

## The Test Runner (firestore.rules.test.ts)
(Verification happens via logic analysis and deployment)
