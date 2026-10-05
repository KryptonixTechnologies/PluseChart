import { useState } from "react";
import type { ContactInput } from "../types/models";

interface ContactFormProps {
  initialValue?: ContactInput;
  onSubmit: (value: ContactInput) => void;
  onCancel: () => void;
}

const emptyContact: ContactInput = { name: "", email: "", phone: "", role: "", department: "", status: "active" };

function ContactForm({ initialValue = emptyContact, onSubmit, onCancel }: ContactFormProps) {
  const [value, setValue] = useState<ContactInput>(initialValue);
  const [error, setError] = useState("");

  const update = (field: keyof ContactInput, fieldValue: string) => setValue((current) => ({ ...current, [field]: fieldValue }));

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value.name.trim() || !value.email.trim() || !value.phone.trim() || !value.department.trim()) {
      setError("Name, email, phone, and department are required.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(value.email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!/^[+\d][\d\s().-]{7,}$/.test(value.phone)) {
      setError("Enter a valid phone number.");
      return;
    }
    setError("");
    onSubmit({ ...value, name: value.name.trim(), email: value.email.trim(), phone: value.phone.trim(), role: value.role.trim(), department: value.department.trim() });
  };

  return (
    <form className="form-stack" onSubmit={submit}>
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="form-grid">
        <label className="form-group">Name<input value={value.name} onChange={(event) => update("name", event.target.value)} placeholder="Full name" /></label>
        <label className="form-group">Email<input type="email" value={value.email} onChange={(event) => update("email", event.target.value)} placeholder="name@company.com" /></label>
        <label className="form-group">Phone<input type="tel" value={value.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+254 700 000 000" /></label>
        <label className="form-group">Role<input value={value.role} onChange={(event) => update("role", event.target.value)} placeholder="Job title" /></label>
        <label className="form-group">Department<input value={value.department} onChange={(event) => update("department", event.target.value)} placeholder="Team or department" /></label>
        <label className="form-group">Status<select value={value.status} onChange={(event) => update("status", event.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
      </div>
      <div className="modal-actions"><button className="secondary-button" type="button" onClick={onCancel}>Cancel</button><button className="primary-button" type="submit">Save Contact</button></div>
    </form>
  );
}

export default ContactForm;
