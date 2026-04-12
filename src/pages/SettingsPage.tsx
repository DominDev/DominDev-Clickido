import { useRef, useState } from 'react';
import { useSettingsStore } from '@store/settingsStore';
import { useTaskStore } from '@store/taskStore';
import { showErrorToast, showSuccessToast } from '@store/uiStore';
import { exportData, getStorageInfo, importData } from '@services/storageService';
import styles from './SettingsPage.module.css';

export default function SettingsPage() {
  const {
    nightMode,
    screensaver,
    display,
    isNightModeActive,
    updateNightMode,
    updateScreensaver,
    updateDisplay,
    resetSettings,
    loadSettings,
  } = useSettingsStore();
  const { loadTasks, loadCompletions } = useTaskStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const storageInfo = getStorageInfo();

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'clickido-backup.json';
    link.click();
    URL.revokeObjectURL(url);

    setImportSummary('Eksport danych został przygotowany do pobrania.');
    showSuccessToast('Wyeksportowano backup JSON');
  };

  const handleOpenImport = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const content = await file.text();
      const success = importData(content);

      if (!success) {
        setImportSummary('Import nie powiódł się. Sprawdź strukturę pliku backupu.');
        showErrorToast('Import danych nie powiódł się');
        return;
      }

      loadTasks();
      loadCompletions();
      loadSettings();

      setImportSummary(`Zaimportowano dane z pliku: ${file.name}`);
      showSuccessToast('Zaimportowano dane z backupu');
    } catch (error) {
      console.error('Import failed:', error);
      setImportSummary('Wystąpił błąd podczas odczytu pliku importu.');
      showErrorToast('Nie udało się odczytać pliku');
    } finally {
      event.target.value = '';
    }
  };

  const storageUsedKb = Math.round(storageInfo.used / 1024);
  const storageAvailableKb = Math.max(0, Math.round(storageInfo.available / 1024));

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>Ustawienia</h1>
        <p>Minimalny panel operacyjny do sterowania MVP i weryfikacji danych lokalnych.</p>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2>Motyw</h2>
          <span className={styles.inlineBadge}>
            {isNightModeActive ? 'Aktywny nocny' : 'Aktywny dzienny'}
          </span>
        </div>
        <div className={styles.buttonRow}>
          <button type="button" onClick={() => updateNightMode({ mode: 'auto' })}>
            Auto
          </button>
          <button
            type="button"
            onClick={() => updateNightMode({ mode: 'manual', enabled: false })}
          >
            Dzień
          </button>
          <button
            type="button"
            onClick={() => updateNightMode({ mode: 'manual', enabled: true })}
          >
            Noc
          </button>
        </div>
        <p className={styles.helpText}>
          Aktualny tryb zapisany: <strong>{nightMode.mode}</strong>, zakres auto:{' '}
          <strong>
            {nightMode.startHour}:00-{nightMode.endHour}:00
          </strong>
        </p>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2>Ekran i screensaver</h2>
          <span className={styles.inlineBadge}>
            {screensaver.enabled ? 'Włączony' : 'Wyłączony'}
          </span>
        </div>
        <div className={styles.toggleList}>
          <button
            type="button"
            onClick={() => updateScreensaver({ enabled: !screensaver.enabled })}
          >
            {screensaver.enabled ? 'Wyłącz screensaver' : 'Włącz screensaver'}
          </button>
          <button
            type="button"
            onClick={() =>
              updateScreensaver({
                idleTimeoutMinutes: Math.max(1, screensaver.idleTimeoutMinutes - 1),
              })
            }
          >
            Timeout -1 min
          </button>
          <button
            type="button"
            onClick={() =>
              updateScreensaver({
                idleTimeoutMinutes: Math.min(30, screensaver.idleTimeoutMinutes + 1),
              })
            }
          >
            Timeout +1 min
          </button>
          <button
            type="button"
            onClick={() => updateScreensaver({ showSeconds: !screensaver.showSeconds })}
          >
            {screensaver.showSeconds ? 'Ukryj sekundy' : 'Pokaż sekundy'}
          </button>
        </div>
        <p className={styles.helpText}>
          Timeout bezczynności: <strong>{screensaver.idleTimeoutMinutes} min</strong>
        </p>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2>Widok danych</h2>
          <span className={styles.inlineBadge}>
            {display.kidsMode ? 'Kids mode' : 'Standard'}
          </span>
        </div>
        <div className={styles.toggleList}>
          <button
            type="button"
            onClick={() => updateDisplay({ showTimeEstimate: !display.showTimeEstimate })}
          >
            {display.showTimeEstimate ? 'Ukryj czas zadań' : 'Pokaż czas zadań'}
          </button>
          <button
            type="button"
            onClick={() => updateDisplay({ showPoints: !display.showPoints })}
          >
            {display.showPoints ? 'Ukryj punkty' : 'Pokaż punkty'}
          </button>
          <button
            type="button"
            onClick={() => updateDisplay({ showMotivation: !display.showMotivation })}
          >
            {display.showMotivation ? 'Ukryj motywację' : 'Pokaż motywację'}
          </button>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2>Dane lokalne</h2>
          <span className={styles.inlineBadge}>localStorage</span>
        </div>
        <dl className={styles.storageGrid}>
          <div>
            <dt>Zajęte miejsce</dt>
            <dd>{storageUsedKb} KB</dd>
          </div>
          <div>
            <dt>Dostępne miejsce</dt>
            <dd>{storageAvailableKb} KB</dd>
          </div>
        </dl>
        <div className={styles.buttonRow}>
          <button type="button" onClick={handleExport}>
            Eksport JSON
          </button>
          <button type="button" onClick={handleOpenImport}>
            Import JSON
          </button>
          <button type="button" onClick={resetSettings}>
            Reset ustawień
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className={styles.hiddenInput}
          onChange={handleImportFile}
        />
        {importSummary && <p className={styles.helpText}>{importSummary}</p>}
      </section>
    </section>
  );
}
