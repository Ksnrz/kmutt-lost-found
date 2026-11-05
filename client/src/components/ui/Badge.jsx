import './Badge.css';

/**
 * Shared Badge Component
 * @param {'pending' | 'success' | 'danger' | 'neutral' | 'count'} variant
 */
export default function Badge({
  children,
  variant = 'pending',
  className = '',
}) {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {children}
    </span>
  );
}

