import type { AppSettings, Contact, Message } from "../types/models";

const now = Date.now();

export const seedContacts: Contact[] = [
  {
    id: "contact-john-mwangi",
    name: "John Mwangi",
    email: "john.mwangi@example.com",
    phone: "+254 712 345 678",
    role: "Project Manager",
    department: "Management",
    status: "active",
    createdAt: new Date(now - 1000 * 60 * 60 * 24 * 12).toISOString(),
  },
  {
    id: "contact-ann-wanjiku",
    name: "Ann Wanjiku",
    email: "ann.wanjiku@example.com",
    phone: "+254 723 456 789",
    role: "Software Engineer",
    department: "Technology",
    status: "active",
    createdAt: new Date(now - 1000 * 60 * 60 * 24 * 10).toISOString(),
  },
  {
    id: "contact-david-kamau",
    name: "David Kamau",
    email: "david.kamau@example.com",
    phone: "+254 734 567 890",
    role: "Business Analyst",
    department: "Operations",
    status: "inactive",
    createdAt: new Date(now - 1000 * 60 * 60 * 24 * 8).toISOString(),
  },
  {
    id: "contact-sarah-maina",
    name: "Sarah Maina",
    email: "sarah.maina@example.com",
    phone: "+254 745 678 901",
    role: "HR Manager",
    department: "Human Resources",
    status: "active",
    createdAt: new Date(now - 1000 * 60 * 60 * 24 * 6).toISOString(),
  },
  {
    id: "contact-peter-otieno",
    name: "Peter Otieno",
    email: "peter.otieno@example.com",
    phone: "+254 756 789 012",
    role: "Marketing Specialist",
    department: "Marketing",
    status: "inactive",
    createdAt: new Date(now - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
];

export const seedMessages: Message[] = [
  {
    id: "message-project-meeting",
    recipientId: "contact-john-mwangi",
    senderName: "John Mwangi",
    subject: "Project meeting",
    content: "The project meeting has been scheduled for tomorrow at 10:00 AM.",
    direction: "received",
    folder: "inbox",
    read: false,
    createdAt: new Date(now - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "message-communication-report",
    recipientId: "contact-ann-wanjiku",
    senderName: "Ann Wanjiku",
    subject: "Communication report",
    content: "Please review the latest communication report before the meeting.",
    direction: "received",
    folder: "inbox",
    read: false,
    createdAt: new Date(now - 1000 * 60 * 90).toISOString(),
  },
  {
    id: "message-document-confirmation",
    recipientId: "contact-david-kamau",
    senderName: "David Kamau",
    subject: "Document confirmation",
    content: "The client has confirmed receipt of the requested documents.",
    direction: "received",
    folder: "inbox",
    read: true,
    createdAt: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "message-team-reminder",
    recipientId: "contact-sarah-maina",
    senderName: "Sarah Maina",
    subject: "Team meeting reminder",
    content: "This is a reminder about our team communication meeting.",
    direction: "received",
    folder: "inbox",
    read: true,
    createdAt: new Date(now - 1000 * 60 * 60 * 25).toISOString(),
  },
];

export const defaultSettings: AppSettings = {
  profile: {
    fullName: "System User",
    email: "admin@pulsechart.com",
    phone: "+254 700 000 000",
    role: "Administrator",
  },
  notifications: {
    emailNotifications: true,
    messageNotifications: true,
    weeklyReports: false,
  },
  system: {
    language: "English",
    timeZone: "Africa/Nairobi",
    dateFormat: "DD/MM/YYYY",
  },
};
