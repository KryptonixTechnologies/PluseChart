import { useState } from "react";
import type { Contact, MessageInput } from "../types/models";

interface MessageFormProps {
  contacts: Contact[];
  initialRecipientId?: string;
  onSubmit: (value: MessageInput) => void;
  onCancel: () => void;
}

function MessageForm({ contacts, initialRecipientId = "", onSubmit, onCancel }: MessageFormProps) {
  const [value, setValue] = useState<MessageInput>({ recipientId: initialRecipientId, subject: "", content: "" });
  const [error, setError] = useState("");

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value.recipientId || !value.subject.trim() || !value.content.trim()) {
      setError("Recipient, subject, and message content are required.");
      return;
    }
    setError("");
    onSubmit({ ...value, subject: value.subject.trim(), content: value.content.trim() });
  };

  return (
    <form className="form-stack" onSubmit={submit}>
      {error && <div className="form-error" role="alert">{error}</div>}
      <label className="form-group">Recipient<select value={value.recipientId} onChange={(event) => setValue((current) => ({ ...current, recipientId: event.target.value }))}><option value="">Select a contact</option>{contacts.filter((contact) => contact.status === "active").map((contact) => <option key={contact.id} value={contact.id}>{contact.name} · {contact.department}</option>)}</select></label>
      <label className="form-group">Subject<input value={value.subject} onChange={(event) => setValue((current) => ({ ...current, subject: event.target.value }))} placeholder="What is this about?" /></label>
      <label className="form-group">Message<textarea rows={6} value={value.content} onChange={(event) => setValue((current) => ({ ...current, content: event.target.value }))} placeholder="Write your message..." /></label>
      <div className="modal-actions"><button className="secondary-button" type="button" onClick={onCancel}>Cancel</button><button className="primary-button" type="submit">Send Message</button></div>
    </form>
  );
}

export default MessageForm;
