import type { ContactStatus } from "../types/models";

function StatusBadge({ status }: { status: ContactStatus }) {
  return <span className={`status-badge ${status}`}>{status === "active" ? "Active" : "Inactive"}</span>;
}

export default StatusBadge;
