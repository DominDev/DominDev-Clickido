/**
 * BottomNav - Bottom navigation bar with integrated FAB
 */

import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useSettingsStore } from '@store/settingsStore';
import { useUIStore } from '@store/uiStore';
import styles from './BottomNav.module.css';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { path: '/today', label: 'Dziś', icon: '📋' },
  { path: '/points', label: 'Punkty', icon: '⭐' },
  { path: '/tasks', label: 'Zadania', icon: '🧩' },
  { path: '/settings', label: 'Ustawienia', icon: '⚙️' },
];

const KIDS_NAV_ITEMS = [
  {
    path: '/today',
    label: 'Dziś',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    path: '/points',
    label: 'Nagrody',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const { display } = useSettingsStore();
  const { openModal } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);

  const isPointsPage = location.pathname === '/points';

  // Close quick menu when navigating to a different page
  useEffect(() => {
    setQuickMenuOpen(false);
  }, [location.pathname]);

  const handleOpenQuickTask = () => {
    setQuickMenuOpen(false);
    openModal('taskForm');
  };

  const handleOpenTaskBase = () => {
    setQuickMenuOpen(false);
    navigate('/tasks');
  };

  const handleFabClick = () => {
    setQuickMenuOpen((current) => !current);
  };

  const handleAddReward = (audience: 'family' | 'child' | 'adult') => {
    setQuickMenuOpen(false);
    openModal('rewardForm', { audience });
  };

  return (
    <>
      <nav className={`${styles.nav} ${display.kidsMode ? styles.kidsNav : ''}`} aria-label="Główna nawigacja">
        {display.kidsMode
          ? KIDS_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `${styles.navItem} ${styles.kidsMode} ${isActive ? styles.active : ''}`
                }
              >
                <span className={styles.iconWrap}>{item.icon}</span>
                <span className={styles.label}>{item.label}</span>
              </NavLink>
            ))
          : DEFAULT_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.active : ''}`
                }
              >
                <span className={styles.iconWrap}>
                  <span className={styles.icon} aria-hidden="true">
                    {item.icon as string}
                  </span>
                </span>
                <span className={styles.label}>{item.label}</span>
              </NavLink>
            ))}

        {!display.kidsMode && (
          <>
            <span className={styles.separator} aria-hidden="true" />
            <button
              type="button"
              className={`${styles.fab} ${quickMenuOpen ? styles.fabOpen : ''}`}
              onClick={handleFabClick}
              aria-label={isPointsPage ? 'Dodaj nagrodę' : 'Otwórz szybkie akcje'}
              aria-expanded={quickMenuOpen}
            >
              <span aria-hidden="true">{quickMenuOpen ? '×' : '＋'}</span>
            </button>
          </>
        )}
      </nav>

      {!display.kidsMode && quickMenuOpen && !isPointsPage && (
        <div className={styles.quickMenuOverlay} onClick={() => setQuickMenuOpen(false)}>
          <div className={styles.quickMenu} role="menu" aria-label="Szybkie akcje" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.quickMenuAction}
              onClick={handleOpenQuickTask}
              role="menuitem"
            >
              <span className={styles.quickMenuEmoji} aria-hidden="true">
                ⚡
              </span>
              <span className={styles.quickMenuText}>
                <strong>Szybkie zadanie</strong>
                <span>Dodaj nowe zadanie od razu.</span>
              </span>
            </button>

            <button
              type="button"
              className={styles.quickMenuAction}
              onClick={handleOpenTaskBase}
              role="menuitem"
            >
              <span className={styles.quickMenuEmoji} aria-hidden="true">
                🧩
              </span>
              <span className={styles.quickMenuText}>
                <strong>Baza zadań</strong>
                <span>Otwórz listę, szablony i edycję.</span>
              </span>
            </button>
          </div>
        </div>
      )}

      {!display.kidsMode && quickMenuOpen && isPointsPage && (
        <div className={styles.quickMenuOverlay} onClick={() => setQuickMenuOpen(false)}>
          <div className={styles.quickMenu} role="menu" aria-label="Dodaj nagrodę" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.quickMenuAction}
              onClick={() => handleAddReward('family')}
              role="menuitem"
            >
              <span className={styles.quickMenuEmoji} aria-hidden="true">
                👨‍👩‍👧
              </span>
              <span className={styles.quickMenuText}>
                <strong>Dla rodziny</strong>
                <span>Nagroda wspólna dla wszystkich.</span>
              </span>
            </button>

            <button
              type="button"
              className={styles.quickMenuAction}
              onClick={() => handleAddReward('child')}
              role="menuitem"
            >
              <span className={styles.quickMenuEmoji} aria-hidden="true">
                🧒
              </span>
              <span className={styles.quickMenuText}>
                <strong>Dla dziecka</strong>
                <span>Nagroda widoczna dla dzieci.</span>
              </span>
            </button>

            <button
              type="button"
              className={styles.quickMenuAction}
              onClick={() => handleAddReward('adult')}
              role="menuitem"
            >
              <span className={styles.quickMenuEmoji} aria-hidden="true">
                🧑
              </span>
              <span className={styles.quickMenuText}>
                <strong>Dla dorosłego</strong>
                <span>Nagroda ukryta w trybie dziecięcym.</span>
              </span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
