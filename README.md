# PulseChart Communication System

PulseChart is a browser-based communication workspace built with React, TypeScript, and Vite. It provides a dashboard for communication activity, contact and account directories, message management, reports, preferences, and a guided workspace onboarding experience.

> **Integration notice:** Multi-tenant sign-in and invite registration require an API server. Configure `VITE_API_BASE_URL` before running the app. Workspace messages and contacts are still browser-local prototype data.

## Getting started

### Requirements

- Node.js 20.19+ or 22.12+
- npm

### Install and run

From the project directory, run:

```sh
npm install
npm run dev
```

Vite prints a local development URL, usually `http://localhost:5173`. Open it in a browser.

Create a `.env.local` file to point the frontend at your API:

```dotenv
VITE_API_BASE_URL=https://api.example.com/api
```

If unset, the frontend sends API requests to `/api` on the current origin. Configure a development proxy or serve the API under that path. The API must allow the frontend origin and the `Authorization` and `X-Tenant-ID` request headers through CORS.

### Build and preview

```sh
npm run build
npm run preview
```

The production build is written to `dist/`. The preview command serves that build locally.

### Lint

```sh
npx eslint src
```

This checks the application source. The repository-wide `npm run lint` may encounter an ESLint TypeScript configuration conflict because the workspace also contains a nested `PluseChart` project.

## Authentication and invite onboarding

- `/login` is the shared login page for all companies. `/sign-in` is an alias.
- `/signup?code=XYZ123` starts registration using an invite code from the query string.
- `/signup/invite/XYZ123` starts registration using a route parameter.
- `/company-signup` registers a new company and its first Administrator.
- `/register` is a legacy alias for the signup page.
- `/setup` and `/onboarding` redirect to `/signup`; employees joining existing companies require a valid invitation.

The invited-user signup page also accepts `invite` as an alternate query parameter and optional `company_id` or `company` query parameters. It saves the pending invite code and company reference in `sessionStorage` so they survive page refreshes in the current tab. Registration submits `{ name, email, password, invite_code, company_id? }` to `POST /auth/register`.

To create a company, the company owner opens `/company-signup`, enters company profile details and administrator credentials, and submits the form. The first user is intended to be assigned the Administrator role by the server. The frontend submits `{ company_name, domain, industry, country, admin_name, admin_email, admin_password, admin_job_title }` to `POST /auth/companies/register`. Both registration endpoints are expected to return a session response as described below. Passwords are submitted over HTTPS to the API; the frontend does not hash or store registration passwords.

Login submits `{ email, password }` to `POST /auth/login`. Both endpoints are expected to return an access token and user information, with an active tenant/company ID. Accepted response fields:

```json
{
  "access_token": "JWT_OR_SESSION_TOKEN",
  "company_id": "company-id",
  "user": {
    "id": "user-id",
    "name": "Example User",
    "email": "user@example.com",
    "role": "Member"
  }
}
```

The frontend also accepts `token` instead of `access_token`, `tenant_id` instead of `company_id`, and a tenant ID under `tenant.id`, `tenant.company_id`, `tenant.tenant_id`, or the user’s tenant/company fields. The response must include `user.id` and `user.email`.

Successful login or signup stores the returned session in tab-scoped `sessionStorage`. Authenticated calls made with `apiRequest` automatically include `Authorization: Bearer <token>` and `X-Tenant-ID: <tenant-id>`. An unauthorized response clears the session. Protected workspace routes require both a token and active tenant context, otherwise the user is sent to `/login`.

The API must validate invite codes, verify the user's membership in the tenant, and authorize every tenant-scoped operation on the server. The tenant header is context, not proof of authorization. Prefer secure server-managed `HttpOnly`, `Secure`, `SameSite` cookies for production sessions when the backend supports them; browser-accessible tokens are exposed to successful cross-site scripting.

## Workspace features

After signing in, the sidebar provides the following pages:

- **Dashboard** — communication summary, recent activity, and message charts.
- **Messages** — browse inbox, sent, and archived messages; search, compose, view, reply, archive, and delete local records.
- **Contacts** — add, view, edit, delete, search, and filter contacts; start a message from a contact profile.
- **Reports** — review communication totals, read rates, charts, and department summaries over a selected period.
- **Settings** — update the local profile, notification preferences, language, time zone, and date format.
- **Accounts** — create local sign-in accounts, choose their roles, and view the team directory.

The app includes sample contacts and messages to make the workspace usable before you add your own records.

## Data and access

Authentication session data is stored in `sessionStorage` for the current browser tab. The invite code is also retained in tab-scoped storage during signup. Existing prototype contacts, messages, settings, and the Accounts directory continue to use browser `localStorage`; these records are not synchronized or scoped by tenant and are not fetched from an API.

## Current limitations

- The frontend expects an external API implementing `/auth/register` and `/auth/login`; no backend is included in this repository.
- Existing contacts, messages, reports, settings, and account-management features remain local prototype data. They are not yet tenant-scoped or synchronized through the API client.
- Plan selection, trial provisioning, M-Pesa/card collection, and the generated employee join link from the former onboarding prototype are not payment or provisioning integrations.
- The API must implement tenant membership checks, invite validation, access-token/session lifecycle, and authorization. A frontend route guard alone is not a security boundary.
- Do not use this prototype to store protected health information, confidential communications, production credentials, or payment data until the backend and security controls are implemented and reviewed.

For production use, provide server-side identity and authorization, secure session management, persistent tenant-isolated storage, validated invitation workflows, and a compliant payment provider integration. Avoid accepting or storing card details directly in this frontend.

## Project structure

```text
src/
  components/   Shared UI components and forms
  data/         Initial sample data and default preferences
  hooks/        App data context and state provider
  pages/        Authentication, onboarding, and workspace pages
  services/     API client, auth session, and browser storage helpers
  types/        TypeScript models
  App.tsx       Routes and authentication guard
```

## Available npm scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and create a production build |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint on the repository |
| `npx eslint src` | Lint the application source tree |
