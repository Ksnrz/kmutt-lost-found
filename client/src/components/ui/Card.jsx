import './Card.css';

/**
 * Shared Card Container
 */
export default function Card({
  children,
  className = '',
  ...props
}) {
  return (
    <div className={`ui-card ${className}`} {...props}>
      {children}
    </div>
  );
}
