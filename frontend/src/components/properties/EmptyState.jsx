import { Building2 } from 'lucide-react';

export default function EmptyState({ title = 'No properties found.', detail = 'Try adjusting your search or filters.', action }) {
  return (
    <div className="property-empty-state">
      <span><Building2 size={22} /></span>
      <h2>{title}</h2>
      <p>{detail}</p>
      {action}
    </div>
  );
}
