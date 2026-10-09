import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { roleNavigation } from '../data/mockData';

export default function ModulePlaceholder({ title, navItems }) {
  const { user } = useAuth();

  return (
    <DashboardLayout user={user} title={title} subtitle="Coming next phase" navItems={navItems || roleNavigation[user.role]}>
      <section className="panel-card module-placeholder">
        <p className="eyebrow">KEYHOUSE WORKSPACE</p>
        <h2>{title} is coming in the next phase</h2>
        <p>This area is reserved for the next frontend phase. Your account and role access are active.</p>
      </section>
    </DashboardLayout>
  );
}
