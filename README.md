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

## Local account setup

- Open `/company-signup` to go through company details, Administrator account, workspace preferences, and team invite setup. Workspace details and preferences are saved in this browser, and the first Administrator is signed in when setup completes.
- Sign in at `/login` with an account created in this browser.
- Add additional local accounts from **Accounts**. New accounts are assigned the selected local role.
- The setup wizard creates a workspace invite code. `/signup` checks the code against the workspace saved in this browser; it cannot invite people to another browser or device.
- `/register` and `/sign-in` are aliases. `/setup` and `/onboarding` redirect to signup.

Passwords are hashed in the browser with Web Crypto before the resulting credential is saved locally. The local login is a demo feature, not production authentication: browser storage is accessible to the user and is not protected by a server. Do not use it for sensitive or production accounts.

## Workspace features

- **Dashboard:** local communication totals, recent activity, and charts.
- **Messages:** browse, search, compose, view, reply, archive, restore, and delete local messages.
- **Contacts:** add, view, edit, delete, search, and filter local contacts.
- **Reports:** review local communication totals, read rate, charts, and department summaries.
- **Settings:** update the current local account profile, notification preferences, language, time zone, and date format.
- **Accounts:** create additional local accounts and review the team directory.

Sample contacts and messages are added the first time the app runs in a browser.

## Data and limitations

App data is kept in browser `localStorage`; it is not synchronized between browsers or devices, and it is not isolated between accounts on the same browser. Signing out does not remove locally saved app data. Clearing this site's browser storage removes the local workspace and its data.

Invite codes are checked only against the workspace saved in the same browser; notifications are not sent, and there is no server-backed authentication, invitation delivery, payment processing, or tenant security. Use this app as a local frontend prototype only.

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
