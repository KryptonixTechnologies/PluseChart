interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">○</div>
      <h3>{title}</h3>
      <p>{message}</p>
      {actionLabel && onAction && <button className="secondary-button" type="button" onClick={onAction}>{actionLabel}</button>}
    </div>
  );
}

export default EmptyState;
