interface DashboardTabsProps {
  onTabClick: (sectionKey: string) => void;
  activeTab: string | null;
}

const TABS = [
  { key: 'kpi', icon: '📋', label: 'KPI', color: '#1e3a8a' },
  { key: 'negozi', icon: '🏬', label: 'Negozi', color: '#065f46' },
  { key: 'venditori', icon: '🏆', label: 'Venditori', color: '#92400e' },
  { key: 'presenze', icon: '👥', label: 'HR', color: '#6d28d9' },
  { key: 'commissioni', icon: '📦', label: 'Critiche', color: '#b91c1c' },
  { key: 'riepilogo', icon: '📊', label: 'Riepilogo', color: '#0e7490' },
  { key: 'lead', icon: '🎯', label: 'Lead', color: '#7c3aed' },
  { key: 'mercato', icon: '🌡️', label: 'Mercato', color: '#be185d' },
  { key: 'strategia', icon: '🚀', label: 'Strategia', color: '#059669' },
];

export function DashboardTabs({ onTabClick, activeTab }: DashboardTabsProps) {
  return (
    <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto" 
      style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
      <span className="text-xs font-bold mr-2 whitespace-nowrap" style={{ color: '#6b7280', fontFamily: "'Syne', sans-serif", letterSpacing: '1px', textTransform: 'uppercase' }}>
        🎤 Clicca per ascoltare:
      </span>
      {TABS.map(tab => (
        <button
          key={tab.key}
          onClick={() => onTabClick(tab.key)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all hover:scale-105"
          style={{
            background: activeTab === tab.key ? tab.color : '#f3f4f6',
            color: activeTab === tab.key ? '#fff' : tab.color,
            border: `1px solid ${activeTab === tab.key ? tab.color : 'rgba(0,0,0,0.08)'}`,
          }}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
