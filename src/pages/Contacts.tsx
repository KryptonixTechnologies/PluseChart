import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import ContactForm from "../components/ContactForm";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";
import { useAppData } from "../hooks/useAppData";
import type { Contact, ContactInput } from "../types/models";

function getInitials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function Contacts() {
  const navigate = useNavigate();
  const { contacts, addContact, updateContact, deleteContact } = useAppData();
  const [searchTerm, setSearchTerm] = useState("");
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState("all");
  const [modal, setModal] = useState<"add" | "edit" | "view" | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [feedback, setFeedback] = useState("");

  const departments = useMemo(() => [...new Set(contacts.map((contact) => contact.department))].sort(), [contacts]);
  const filteredContacts = contacts.filter((contact) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch = [contact.name, contact.email, contact.role, contact.department].some((field) => field.toLowerCase().includes(query));
    return matchesSearch && (department === "all" || contact.department === department) && (status === "all" || contact.status === status);
  });

  const saveContact = (input: ContactInput) => {
    const duplicate = contacts.some((contact) => contact.email.toLowerCase() === input.email.toLowerCase() && contact.id !== selectedContact?.id);
    if (duplicate) {
      setFeedback("A contact with that email already exists.");
      return;
    }
    if (selectedContact) updateContact(selectedContact.id, input); else addContact(input);
    setModal(null);
    setSelectedContact(null);
    setFeedback(selectedContact ? "Contact updated." : "Contact added.");
  };

  const openEdit = (contact: Contact) => { setSelectedContact(contact); setModal("edit"); };
  const openView = (contact: Contact) => { setSelectedContact(contact); setModal("view"); };
  const closeModal = () => { setModal(null); setSelectedContact(null); };

  return (
    <div className="contacts-page">
      <div className="page-heading"><div><h1>Contacts</h1><p>Manage people and organizations in your communication network.</p></div><button className="primary-button" type="button" onClick={() => setModal("add")}>+ Add Contact</button></div>
      {feedback && <div className="feedback success" role="status">{feedback}<button type="button" onClick={() => setFeedback("")} aria-label="Dismiss notification">×</button></div>}
      <div className="contacts-summary">
        <div className="contact-summary-card"><div className="summary-icon blue">◉</div><div><span>Total Contacts</span><strong>{contacts.length}</strong></div></div>
        <div className="contact-summary-card"><div className="summary-icon green">●</div><div><span>Active</span><strong>{contacts.filter((contact) => contact.status === "active").length}</strong></div></div>
        <div className="contact-summary-card"><div className="summary-icon purple">▣</div><div><span>Departments</span><strong>{departments.length}</strong></div></div>
      </div>
      <div className="contacts-card">
        <div className="contacts-toolbar"><div><h2>All Contacts</h2><p>{filteredContacts.length} contacts found</p></div><div className="contacts-filters"><div className="contact-search"><span>⌕</span><input type="search" placeholder="Search contacts..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /></div><select value={department} onChange={(event) => setDepartment(event.target.value)}><option value="all">All Departments</option>{departments.map((item) => <option key={item} value={item}>{item}</option>)}</select><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All Statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div></div>
        <div className="contacts-grid">{filteredContacts.length ? filteredContacts.map((contact) => <div className="contact-card" key={contact.id}><div className="contact-card-header"><div className="large-contact-avatar">{getInitials(contact.name)}</div><StatusBadge status={contact.status} /></div><div className="contact-card-body"><h3>{contact.name}</h3><p className="contact-role">{contact.role || "No role provided"}</p><div className="contact-details"><div><span>✉</span><p>{contact.email}</p></div><div><span>☎</span><p>{contact.phone}</p></div><div><span>▣</span><p>{contact.department}</p></div></div></div><div className="contact-card-footer"><button type="button" onClick={() => navigate("/messages", { state: { recipientId: contact.id } })}>Message</button><button type="button" onClick={() => openView(contact)}>View Profile</button><button type="button" onClick={() => openEdit(contact)}>Edit</button><button className="danger-text-button" type="button" onClick={() => setContactToDelete(contact)}>Delete</button></div></div>) : <EmptyState title="No contacts found" message="Try changing your search or filters, or add your first contact." actionLabel="Add Contact" onAction={() => setModal("add")} />}</div>
      </div>
      {modal === "add" && <Modal title="Add contact" onClose={closeModal}><ContactForm onSubmit={saveContact} onCancel={closeModal} /></Modal>}
      {modal === "edit" && selectedContact && <Modal title="Edit contact" onClose={closeModal}><ContactForm initialValue={selectedContact} onSubmit={saveContact} onCancel={closeModal} /></Modal>}
      {modal === "view" && selectedContact && <Modal title={selectedContact.name} onClose={closeModal}><div className="contact-profile"><div className="large-contact-avatar">{getInitials(selectedContact.name)}</div><StatusBadge status={selectedContact.status} /><dl><div><dt>Email</dt><dd>{selectedContact.email}</dd></div><div><dt>Phone</dt><dd>{selectedContact.phone}</dd></div><div><dt>Role</dt><dd>{selectedContact.role || "Not provided"}</dd></div><div><dt>Department</dt><dd>{selectedContact.department}</dd></div></dl><div className="modal-actions"><button className="secondary-button" type="button" onClick={() => { closeModal(); navigate("/messages", { state: { recipientId: selectedContact.id } }); }}>Start Message</button><button className="primary-button" type="button" onClick={() => openEdit(selectedContact)}>Edit Contact</button></div></div></Modal>}
      {contactToDelete && <ConfirmDialog title="Delete contact?" message={`This will permanently remove ${contactToDelete.name} from your contacts.`} onClose={() => setContactToDelete(null)} onConfirm={() => { deleteContact(contactToDelete.id); setContactToDelete(null); setFeedback("Contact deleted."); }} />}
    </div>
  );
}

export default Contacts;
