import './AlertCallout.css';

/**
 * Shared Alert / Callout Box
 */
export default function AlertCallout({
  children,
  className = '',
}) {
  return (
    <div className={`ui-alert-callout ${className}`}>
      {children}
    </div>
  );
}

