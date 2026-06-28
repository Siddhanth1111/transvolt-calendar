import { useCalendar } from '../../contexts/CalendarContext';
import MiniCalendar from '../Calendar/MiniCalendar';

export default function Sidebar({ collapsed }: { collapsed: boolean }) {
  const { openCreateModal } = useCalendar();

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <button className="create-btn" onClick={() => openCreateModal()}>
        <span className="create-btn-plus">
          <svg viewBox="0 0 36 36" width="36" height="36">
            <path fill="#34A853" d="M16 16v14h4V16h14v-4H20V-2h-4v14H-2v4z" />
          </svg>
        </span>
        Create
      </button>
      <MiniCalendar />
    </aside>
  );
}
