import { isValidElement } from 'react';

export function PageHeader({ eyebrow, title, description, actions, children }) {
  return (
    <header className="page-heading">
      <div className="page-heading-main">
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1>{title}</h1>
          {description && <p className="page-description">{description}</p>}
        </div>
        {actions && <div className="page-actions">{actions}</div>}
      </div>
      {children}
    </header>
  );
}

export function StatsStrip({ items }) {
  return (
    <div className="stats-strip">
      {items.map((item) => (
        <div className="stat-item" key={item.label}>
          <p className="stat-label">{item.label}</p>
          <p className="stat-value">{item.value}</p>
          {item.detail && <p className="stat-detail">{item.detail}</p>}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty-state">
      {Icon && (
        <span className="empty-state-icon">
          {isValidElement(Icon) ? Icon : <Icon size={25} strokeWidth={1.5} />}
        </span>
      )}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
