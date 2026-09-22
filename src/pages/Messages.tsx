import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import MessageForm from "../components/MessageForm";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import { useAppData } from "../hooks/useAppData";
import type { Message, MessageInput } from "../types/models";

function formatMessageDate(date: string) { return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date)); }
function getInitials(name: string) { return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(); }

type Tab = "inbox" | "sent" | "archived";

function Messages() {
  const location = useLocation();
  const { contacts, messages, addMessage, updateMessage, deleteMessage } = useAppData();
  const [activeTab, setActiveTab] = useState<Tab>("inbox");
  const [searchTerm, setSearchTerm] = useState("");
  const [composeOpen, setComposeOpen] = useState(() => Boolean((location.state as { recipientId?: string } | null)?.recipientId));
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [feedback, setFeedback] = useState("");
  const [recipientId, setRecipientId] = useState<string>(() => (location.state as { recipientId?: string } | null)?.recipientId ?? "");

  const counts = useMemo(() => ({ inbox: messages.filter((message) => message.folder === "inbox").length, sent: messages.filter((message) => message.folder === "sent").length, archived: messages.filter((message) => message.folder === "archived").length }), [messages]);
  const filteredMessages = messages.filter((message) => {
    const query = searchTerm.toLowerCase();
    const matchesTab = message.folder === activeTab;
    const matchesSearch = [message.senderName, message.subject, message.content].some((field) => field.toLowerCase().includes(query));
    return matchesTab && matchesSearch;
  });

  const submitMessage = (input: MessageInput) => { addMessage(input); setComposeOpen(false); setRecipientId(""); setFeedback("Message sent."); };
  const closeDetails = () => setSelectedMessage(null);
  const openMessage = (message: Message) => { setSelectedMessage(message); if (!message.read) updateMessage(message.id, { read: true }); };

  return (
    <div className="messages-page">
      <div className="page-heading"><div><h1>Messages</h1><p>Manage your communication and stay connected with your contacts.</p></div><button className="primary-button" type="button" onClick={() => setComposeOpen(true)}>+ New Message</button></div>
      {feedback && <div className="feedback success" role="status">{feedback}<button type="button" onClick={() => setFeedback("")} aria-label="Dismiss notification">×</button></div>}
      <div className="messages-card"><div className="messages-toolbar"><div className="message-tabs">{(["inbox", "sent", "archived"] as Tab[]).map((tab) => <button key={tab} type="button" className={activeTab === tab ? "message-tab active" : "message-tab"} onClick={() => setActiveTab(tab)}>{tab[0].toUpperCase() + tab.slice(1)}<span>{counts[tab]}</span></button>)}</div><div className="message-search"><span>⌕</span><input type="search" placeholder="Search messages..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /></div></div>
        <div className="messages-list">{filteredMessages.length ? filteredMessages.map((message) => <div className={message.read ? "message-row" : "message-row unread"} key={message.id} onClick={() => openMessage(message)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") openMessage(message); }}><div className="message-avatar">{getInitials(message.senderName)}</div><div className="message-content"><div className="message-main"><strong>{message.senderName}</strong>{!message.read && <span className="unread-badge">Unread</span>}</div><h3>{message.subject}</h3><p>{message.content}</p></div><div className="message-row-actions"><span className="message-time">{formatMessageDate(message.createdAt)}</span><button type="button" onClick={(event) => { event.stopPropagation(); updateMessage(message.id, { folder: message.folder === "archived" ? "inbox" : "archived" }); }} aria-label={message.folder === "archived" ? "Restore message" : "Archive message"}>{message.folder === "archived" ? "Restore" : "Archive"}</button><button className="danger-text-button" type="button" onClick={(event) => { event.stopPropagation(); setMessageToDelete(message); }}>Delete</button></div></div>) : <EmptyState title={`No ${activeTab} messages`} message={searchTerm ? "Try a different search term." : "Your message list is clear."} actionLabel={activeTab === "sent" ? "Send a message" : undefined} onAction={() => setComposeOpen(true)} />}</div>
      </div>
      {composeOpen && <Modal title="New message" onClose={() => { setComposeOpen(false); setRecipientId(""); }}><MessageForm contacts={contacts} initialRecipientId={recipientId} onSubmit={submitMessage} onCancel={() => { setComposeOpen(false); setRecipientId(""); }} /></Modal>}
      {selectedMessage && <Modal title={selectedMessage.subject} onClose={closeDetails}><article className="message-detail"><div className="message-detail-meta"><strong>{selectedMessage.senderName}</strong><span>{formatMessageDate(selectedMessage.createdAt)}</span></div><p>{selectedMessage.content}</p><div className="modal-actions"><button className="secondary-button" type="button" onClick={() => { updateMessage(selectedMessage.id, { read: !selectedMessage.read }); setSelectedMessage({ ...selectedMessage, read: !selectedMessage.read }); }}>{selectedMessage.read ? "Mark unread" : "Mark read"}</button><button className="primary-button" type="button" onClick={() => { updateMessage(selectedMessage.id, { folder: "archived" }); closeDetails(); setFeedback("Message archived."); }}>Archive</button></div></article></Modal>}
      {messageToDelete && <ConfirmDialog title="Delete message?" message="This message will be removed permanently from local storage." onClose={() => setMessageToDelete(null)} onConfirm={() => { deleteMessage(messageToDelete.id); setMessageToDelete(null); setFeedback("Message deleted."); }} />}
    </div>
  );
}

export default Messages;
