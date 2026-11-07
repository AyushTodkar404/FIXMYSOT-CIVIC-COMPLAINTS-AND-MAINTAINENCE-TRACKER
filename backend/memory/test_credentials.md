# Local authentication configuration

Do not store credentials in this repository. To seed the first administrator,
configure these environment variables before starting the backend:

- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD` (at least 8 characters)

The server creates an administrator only when no account with `role: admin`
exists. Municipal workers are created by an administrator in the User Management
dashboard or through the protected API.
