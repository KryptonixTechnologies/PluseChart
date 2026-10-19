# PulseChart Communication System

## System Report

**Report date:** October 19, 2026

### 1. Executive Summary

PulseChart is a browser-based communication management prototype built to organize staff contacts and message records in one workspace. It provides a dashboard, contact directory, inbox and sent-message views, reply composition, activity reports, workspace settings, subscription-plan selection, and member registration through a single-use invite code.

The current version stores its information in the browser. It is suitable for demonstration and local testing, but it is not a shared, production-ready communication or identity platform.

### 2. Purpose

The system gives a team a simple place to keep contact details, review communication activity, and compose messages to people in its directory. Its dashboard and reports summarize the records held by the application, while settings allow the user to adjust profile and workspace preferences.

### 3. Main Features

- **Member access:** Administrators create a workspace and select a subscription plan. Invited members register with a one-time workspace invite code, name, email, and password. Returning users sign in with their email and password. Signed-out visitors are redirected to sign-in when they open protected workspace pages.
- **Dashboard:** View total, sent, received, and unread message counts; total contacts; a seven-day activity chart; message status; and recent communications.
- **Contacts:** Add, search, filter, view, edit, message, and delete contact records. Contact fields include name, email, phone, role, department, and active status.
- **Messages:** Review Inbox, Sent, and Archived records; search messages; compose messages to active contacts; open message details; mark messages read or unread; archive, restore, or delete messages; and reply to received messages. A reply opens the composer with the sender selected and an `Re:` subject.
- **Reports:** Review communication totals, sent and received activity, read rate, and charts over a selected time period.
- **Accounts:** Administrators can create additional account records with a name, email, optional phone, role, and password. Members joining through an invite code receive the Member role.
- **Settings:** Update the displayed profile, notification preferences, language, time zone, and date-format preference.
- **Subscription plans:** Review Starter, Growth, and Enterprise pricing cards in administrator setup or from the Subscription page. Prices are KSh 1,500, KSh 4,900, and KSh 12,000 per month; annual billing is ten monthly payments.

### 4. How to Use the System

1. **Start the application.** From the project folder, install dependencies and start the development server:

   ```bash
   npm install
   npm run dev
   ```

   Open the local URL printed by Vite in the terminal. The default is usually `http://localhost:5173`; Vite may choose a different port if that one is occupied.

2. **Set up a workspace.** Open `/company-signup`, enter the company and administrator details, then continue to subscription setup. Select a trial or paid plan and choose monthly or yearly billing. Create the workspace; the administrator is signed in and shown the workspace invite code.

3. **Invite a teammate.** Copy and share the invite code. The teammate opens `/signup` (or `/signup/invite/:code`), enters the code, name, email, and a password of at least eight characters, then creates the account. They are signed in and taken to the dashboard. Each invite code works once and only where the workspace data is available in the same browser profile.

4. **Sign in later.** Enter the member's email address and password at `/login`. Use **Sign out** to end the session.

5. **Add more members.** After the one-time invite has been redeemed, an administrator can create additional accounts from **Accounts**, assigning each person a role and password.

6. **Manage contacts.** Open **Contacts** and choose **Add Contact**. Use the search box and filters to find people. Contact actions allow viewing or editing details, starting a message, or deleting a record.

7. **Read or reply to a message.** Open **Messages** and select an item in Inbox. In the message detail, choose **Reply**. The composer selects the sender and prepares a reply subject; write the response and choose **Send Message**. The resulting record appears in Sent. New messages can also be composed from **New Message** or a contact's **Message** action.

8. **Review reports and preferences.** Open **Reports** to inspect activity for the available time periods. Open **Settings** to change profile, notification, and display preferences, then save.

### 5. Data and Security Notes

PulseChart currently uses the browser's `localStorage`. Contacts, messages, settings, account profiles, password credentials, workspace details, invite-code redemption status, and the current session are kept in the browser for the current site origin. They are not synchronized between devices or browsers. Clearing site data can remove them.

Passwords are converted to salted PBKDF2 hashes before they are stored; the application does not save the entered password as plain text. However, both the account data and password hashes remain under the control of the browser. This local sign-in is for prototyping only and must not be treated as production authentication or authorization. There is no server-side identity verification, password reset, account recovery, or enforced role-based access control.

Messages are saved as application records only. The system does not currently deliver or receive real email, SMS, or push notifications. Notification preferences are saved locally but do not connect to a delivery service.

### 6. Current Limitations and Recommended Next Steps

- Data is isolated to one browser profile; there is no shared team database, backup, or synchronization.
- Invite codes are single-use and only validate against a workspace in the same browser profile. There is no remote invitation service or invite-code recovery flow.
- Subscription prices and account limits are displayed in the interface, but checkout is not connected and account limits are not enforced.
- Local accounts are not appropriate for protecting sensitive information or production access.
- Message sending and receiving are simulated within the application; external communication integrations are not configured.
- Role names are stored as profile information and do not currently grant or restrict permissions.

For production use, connect the application to a server-backed authentication provider and database, implement authorization and account recovery, and integrate an approved messaging service. Define data retention, backup, privacy, and security requirements before using real personal or health information.

### 7. Technology Overview

The frontend uses React, TypeScript, React Router, Vite, and Recharts. Application records are managed through a shared React context and persisted with browser storage. The project can be checked and built with:

```bash
npm run lint
npm run build
```

The workspace-wide lint command may require configuration if multiple nested project folders are opened together.

### 8. Conclusion

PulseChart provides a practical local prototype for organizing contacts and communication records, reviewing activity, and trying member registration and sign-in. Its browser-only storage and simulated messaging are useful for demonstration, while a backend and production security controls are required before deployment for real organizational use.
