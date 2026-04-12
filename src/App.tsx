import { Routes, Route, Navigate } from 'react-router-dom';
import { useSettingsStore } from '@store/settingsStore';
import { useTheme } from '@hooks/useTheme';
import { useScreensaver } from '@hooks/useScreensaver';
import { useWakeLock } from '@hooks/useWakeLock';
import Layout from '@components/layout/Layout';
import TodayPage from '@pages/TodayPage';
import PointsPage from '@pages/PointsPage';
import TasksPage from '@pages/TasksPage';
import SettingsPage from '@pages/SettingsPage';
import Screensaver from '@components/screensaver/Screensaver';

function ParentOnlyRoute({ children }: { children: JSX.Element }) {
  const { display } = useSettingsStore();

  if (display.kidsMode) {
    return <Navigate to="/today" replace />;
  }

  return children;
}

function App() {
  const { screensaverEnabled } = useSettingsStore();

  useTheme();
  useScreensaver();
  useWakeLock();

  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/today" replace />} />
          <Route path="today" element={<TodayPage />} />
          <Route path="points" element={<PointsPage />} />
          <Route
            path="tasks"
            element={
              <ParentOnlyRoute>
                <TasksPage />
              </ParentOnlyRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ParentOnlyRoute>
                <SettingsPage />
              </ParentOnlyRoute>
            }
          />
        </Route>
      </Routes>
      {screensaverEnabled && <Screensaver />}
    </>
  );
}

export default App;
