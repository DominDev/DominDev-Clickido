/**
 * Layout - Main app layout wrapper
 */

import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import { Toast } from '@components/ui';
import { TaskForm } from '@components/task';
import { InstallBanner, OnboardingFlow } from '@components/onboarding';
import { useTaskStore } from '@store/taskStore';
import { useSettingsStore } from '@store/settingsStore';
import { runMigrations } from '@services/storageService';
import styles from './Layout.module.css';

export default function Layout() {
  const { loadTasks, loadCompletions } = useTaskStore();
  const { loadSettings } = useSettingsStore();

  // Initialize app on mount
  useEffect(() => {
    runMigrations();
    loadSettings();
    loadTasks();
    loadCompletions();
  }, [loadTasks, loadCompletions, loadSettings]);

  return (
    <div className={styles.layout}>
      <TopBar />
      <InstallBanner />
      <main className={styles.main}>
        <Outlet />
      </main>
      <BottomNav />
      <TaskForm />
      <Toast />
      <OnboardingFlow />
    </div>
  );
}
