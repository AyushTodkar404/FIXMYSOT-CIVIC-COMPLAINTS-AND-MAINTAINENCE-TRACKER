THE ENTIRE PROJECT FILE IS HERE :-https://drive.google.com/file/d/1HXi77qb_48LhPlos-DYJNH_jgeQQUhdQ/view?usp=sharing
DOWNLOAD IT AND INSTALL ALL THE DEPENDANCIES FROM requirements.txt file

# FixMySpot — AI Coding Instructions

## Project Overview

FixMySpot is a full-stack civic issue reporting and management platform.

The application allows citizens to report public issues, track their resolution, and interact with municipal authorities. Municipal workers manage assigned issues, while administrators control privileged users and municipal worker accounts.

The project currently includes:

* Citizen authentication
* Municipal Worker authentication
* Administrator authentication
* Role-based authorization
* Citizen Dashboard
* Municipal Dashboard
* Admin Dashboard
* Complaint/issue reporting
* Complaint lifecycle and status workflow
* Before/after resolution images
* Notifications
* User profile section
* Interactive maps
* Satellite map view
* Analytics
* Leaderboard
* Municipal worker management by administrators

---

## Core Development Rules

### 1. Preserve Existing Functionality

Before changing anything:

* Inspect the existing implementation.
* Understand how the relevant frontend, backend, API, database model, authentication, and state management work.
* Do not rewrite working functionality unnecessarily.
* Do not remove existing features unless explicitly requested.
* Do not create duplicate implementations of functionality that already exists.
* Prefer extending existing components, services, controllers, models, and utilities.

Every modification must avoid regressions in unrelated features.

---

## 2. Authentication and Authorization

FixMySpot uses role-based access control.

Supported roles:

* `citizen`
* `municipal`
* `admin`

### Registration

Public registration is ONLY for citizens.

A newly registered public user must automatically receive:

```text
role = citizen
```

Users must never be able to assign themselves:

```text
role = municipal
role = admin
```

Do not rely on frontend restrictions for security.

All role and permission checks MUST be enforced on the backend.

### Login

The login interface uses:

* Email
* Password

Do not require users to manually select their role.

After authentication, determine the role from the authenticated account and redirect the user to the appropriate dashboard.

### Privileged Accounts

Municipal workers cannot publicly register themselves.

Only an administrator can create/manage municipal worker accounts.

Administrators cannot publicly register themselves.

Admin creation/initialization must remain backend-controlled.

### Security Rule

Never trust:

* frontend role values
* hidden form fields
* disabled buttons
* React state
* localStorage values
* client-side authorization checks

The backend must always verify:

1. Authentication
2. JWT/session validity
3. User identity
4. User role
5. Required permissions

---

## 3. Backend Security

Never expose secrets to the React frontend.

Sensitive configuration must use environment variables.

Examples:

```text
MONGODB_URI
JWT_SECRET
ADMIN_EMAIL
ADMIN_PASSWORD
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

Never hardcode:

* passwords
* JWT secrets
* API secrets
* database credentials
* Cloudinary secrets
* privileged access codes

Never commit `.env` files or secrets to GitHub.

---

## 4. Database

Use the existing MongoDB/Mongoose architecture.

Before modifying a schema:

* Inspect the current schema.
* Preserve existing fields.
* Preserve existing data compatibility where practical.
* Add fields only when required.

Do not introduce a second model for something already represented by an existing model.

Use proper validation for user-controlled data.

Passwords must always be hashed before storage.

Never store plaintext passwords.

---

## 5. Complaint System

The complaint/issue system is the core of FixMySpot.

Do not simplify or replace the existing complaint lifecycle.

Preserve:

* Issue creation
* Issue status
* Issue location
* Citizen ownership
* Municipal workflow
* Notifications
* Before/after resolution
* Existing issue history
* Comments
* Analytics integration

When modifying complaint behavior, check all affected areas:

* Backend model
* Controllers
* Routes
* Authentication/authorization middleware
* Frontend pages
* Dashboard statistics
* Notifications
* Maps
* Analytics

A complaint-related change should not silently break another part of the complaint lifecycle.

---

## 6. Location and Maps

FixMySpot uses geographic data and interactive maps.

When modifying map functionality:

* Preserve existing map functionality.
* Preserve satellite view.
* Preserve existing coordinates.
* Validate latitude/longitude.
* Do not unnecessarily replace the existing map library.
* Handle slow map/network loading gracefully.

Never assume that map tiles or geocoding services are always immediately available.

Provide useful loading and error states where appropriate.

---

## 7. Network Reliability

The application may be used on slow or unstable internet connections.

Frontend API requests should have:

* Loading states
* Error states
* Useful error messages
* Retry behavior where appropriate

Do not interpret a network failure as an application-state failure.

For example, distinguish between:

```text
Network failure
401 Unauthorized
403 Forbidden
404 Not Found
500 Server Error
```

Do not silently swallow API errors.

---

## 8. Frontend Guidelines

The frontend is React-based.

Before creating a new component:

* Search for an existing reusable component.
* Reuse existing UI patterns.
* Follow the current design system.
* Preserve dark mode.
* Preserve responsive behavior.
* Preserve existing navigation.

Avoid unnecessarily adding new dependencies.

Do not create huge monolithic components when existing architecture supports smaller reusable components.

---

## 9. API Changes

Before creating a new endpoint:

* Check whether an existing endpoint already provides the required functionality.
* Follow the existing API naming conventions.
* Apply authentication middleware where required.
* Apply role authorization where required.
* Validate request data on the backend.
* Return consistent HTTP status codes.
* Return useful error messages.

Never rely solely on frontend validation.

---

## 10. Admin Authorization

Admin-only operations must be protected server-side.

Examples:

* Creating municipal workers
* Editing municipal workers
* Deleting municipal workers
* Managing privileged accounts
* Other administrative operations

A user with a citizen or municipal role must receive an authorization error when attempting an admin-only operation.

Do not merely hide admin buttons on the frontend.

---

## 11. Municipal Authorization

Municipal operations must also respect role permissions.

A citizen must never be able to access municipal-only operations simply by modifying a request.

Do not trust a client-provided role.

Always obtain the authenticated user's role from the verified authentication context.

---

## 12. Images and Media

FixMySpot uses before/after resolution images.

When modifying image handling:

* Preserve existing before images.
* Preserve existing after/resolution images.
* Validate uploads.
* Handle failed uploads gracefully.
* Avoid unnecessarily converting large images to Base64.
* Do not expose private credentials to the frontend.

If Cloudinary or another external media service is already configured, use the existing integration rather than creating a second upload system.

---

## 13. Notifications

Notifications are already implemented.

When adding new events:

* Reuse the existing notification architecture.
* Do not create a second notification system.
* Ensure notifications are associated with the correct user.
* Preserve read/unread behavior.
* Do not generate duplicate notifications unnecessarily.

---

## 14. Analytics

Analytics must be based on actual application data.

Do not hardcode statistics merely to make the dashboard look better.

If adding a new metric:

* Determine its backend data source.
* Ensure calculations are correct.
* Handle empty datasets.
* Handle loading and error states.

---

## 15. Code Changes

Before editing:

1. Inspect relevant files.
2. Understand existing data flow.
3. Identify dependencies.
4. Determine which backend and frontend files are affected.
5. Make the smallest coherent change required.

After editing:

1. Check imports.
2. Check API routes.
3. Check frontend API calls.
4. Check authorization.
5. Check database interactions.
6. Check for unused code.
7. Run available tests/build/lint commands.
8. Fix errors caused by your changes.

Do not claim that something works unless it has been verified.

---

## 16. Git Safety

Do not:

* Delete unrelated files.
* Reset unrelated user changes.
* Rewrite the entire project unnecessarily.
* Commit secrets.
* Modify `.env` files containing real credentials.

Before destructive changes, inspect the repository state.

Preserve existing user work.

---

## 17. Feature Development Process

For every requested feature:

### Step 1 — Understand

Inspect the relevant existing implementation.

### Step 2 — Plan

Identify:

* Frontend changes
* Backend changes
* Database changes
* API changes
* Authorization requirements
* UI changes

### Step 3 — Implement

Make the smallest complete implementation.

### Step 4 — Integrate

Ensure the new feature works with:

* Authentication
* Authorization
* Notifications
* Dashboards
* Existing APIs
* Existing database models

### Step 5 — Verify

Run the relevant build/test/lint commands.

Check both success and failure cases.

### Step 6 — Report

At the end, clearly state:

* Files modified
* What changed
* Any database/schema changes
* Any environment variables required
* Tests/builds performed
* Any remaining limitations

---

## Most Important Rule

Do not treat FixMySpot as a blank project.

It is an existing working application.

**Understand first. Modify second.**

Do not replace working architecture simply because another implementation is possible.

Prioritize:

1. Security
2. Correctness
3. Existing functionality
4. Maintainability
5. User experience
6. Performance
7. Visual improvements

When two approaches are possible, prefer the one that introduces fewer unnecessary changes while maintaining a clean architecture.
