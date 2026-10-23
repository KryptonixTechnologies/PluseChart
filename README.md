# PulseChart Communication System

PulseChart is a browser-based communication workspace built with React, TypeScript, and Vite. This version is frontend-only: accounts, workspace details, contacts, messages, and preferences are stored in the current browser's `localStorage`. No API or server is used.

## Getting started

Requirements: Node.js 20.19+ or 22.12+, and npm.

```sh
npm install
npm run dev
```

Vite prints a local development URL, usually `http://localhost:5173`.

## Build and lint

```sh
npm run build
npm run lint
npm run preview
```

The production build is written to `dist/`.

## Workspaces, Invitations, and Sign-in

- Open `/company-signup` to enter company details, administrator credentials, and a subscription choice. The setup wizard offers Starter (KSh 1,500/month), Growth (KSh 4,900/month), and Enterprise (KSh 12,000/month) plans, with monthly or annual billing. Annual billing is priced at ten monthly payments.
- On successful setup, the administrator is signed in and shown a workspace invite code. Copy and share this code with one teammate.
- The invited teammate opens `/signup`, enters the invite code, their name, email address, and a password of at least eight characters, then selects **Create account**. The account is created with the Member role and signed in automatically. `/signup/invite/:code` and the `code` or `invite` query parameters can prefill the code.
- Each invite code can be redeemed once. To add more teammates, an administrator can create accounts from **Accounts**.
- Invite validation uses the workspace data stored in the current browser profile. A code will not work in another browser or on another device because workspaces are not synchronized.
- Sign in at `/login` using an account's email address and password. The sign-in form accepts manually entered credentials; it does not require choosing a saved account.
- `/register` redirects to signup, `/sign-in` redirects to login, and `/setup` and `/onboarding` redirect to signup.

Passwords are hashed in the browser with Web Crypto before the resulting credential is saved locally. This authentication is a demo feature, not production authentication: browser storage is accessible to the user and is not protected by a server. Do not use it for sensitive or production accounts.

## Subscription and Billing

Plan options appear as individual pricing cards during administrator setup and on the Subscription page. Annual prices equal ten monthly payments (two months free). Trial duration is not configured. Paid checkout is not connected, so no payment details are collected and no charge is made. Account limits are displayed on the plans but are not currently enforced by account creation.

## Workspace features

- **Dashboard:** communication totals, recent activity, and charts.
- **Messages:** chat in public or private channels and direct conversations; search history; pin channel messages; mention teammates; and share images, PDFs, and text/code files up to 1 MB per message. Markdown and fenced code blocks are rendered in chat.
- **Contacts:** add, view, edit, delete, search, and filter contacts.
- **Reports:** review communication totals, read rate, charts, and department summaries.
- **Settings:** update the current account profile, notification preferences, language, time zone, and date format.
- **Accounts:** create additional accounts and review the team directory.

Sample contacts and messages are added the first time the app runs in a browser.

## Data and limitations

App data is kept in browser `localStorage`; it is not synchronized between browsers or devices, and it is not isolated between accounts on the same browser. Message changes are reflected in other tabs of the same browser profile, but there is no server-backed real-time delivery between team members. Signing out does not remove locally saved app data. Clearing this site's browser storage removes the local workspace and its data.

Channel owners can create and manage channels, choose members, and pin messages. Workspace administrators can manage every channel and manage accounts from the Accounts page. Mentions and message attachments are stored locally with chat history; they do not send push notifications or upload files to a shared server.

Invite codes are checked only against the workspace saved in the same browser and can be redeemed once. Notifications are not sent, and there is no server-backed authentication, invitation delivery, payment processing, or tenant security. Use this app as a frontend prototype only.

## Project structure

```text
src/
  components/   Shared UI components and forms
  data/         Initial sample data and default preferences
  hooks/        Local app state and authentication
  pages/        Authentication and workspace pages
  services/     Browser storage, local password hashing, and date formatting
  types/        Application models
  App.tsx       Routes and local authentication guard
```
