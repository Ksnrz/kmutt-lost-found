import { Inbox } from 'lucide-react';
import './EmptyState.css';

export default function EmptyState({ title, description, actions, as: Heading = 'h3', compact = false }) {
  return (
    <div className={compact ? 'empty-state empty-state-compact' : 'empty-state'}>
      <span className="empty-state-icon" aria-hidden="true"><Inbox /></span>
      <Heading className="empty-state-title">{title}</Heading>
      {description && <p className="empty-state-description">{description}</p>}
      {actions && <div className="empty-state-actions">{actions}</div>}
    </div>
  );
}
