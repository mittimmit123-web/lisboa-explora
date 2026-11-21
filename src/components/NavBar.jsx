const TABS = [
  { id: 'map', label: 'Map', icon: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14' },
  { id: 'collection', label: 'Collection', icon: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z' },
  { id: 'friends', label: 'Friends', icon: 'M9 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c.8-3.5 3.5-5.5 6.5-5.5s5.7 2 6.5 5.5M17 11.5a2.5 2.5 0 1 0 0-5M16.5 14.5c2.4.2 4.3 1.9 5 4.5' },
]

export default function NavBar({ active, onChange }) {
  return (
    <nav className="navbar" aria-label="Main">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={tab.id === active ? 'nav-item active' : 'nav-item'}
          onClick={() => onChange(tab.id)}
          data-tour={`nav-${tab.id}`}
          aria-current={tab.id === active ? 'page' : undefined}
        >
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={tab.icon} />
          </svg>
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
