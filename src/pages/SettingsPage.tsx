import { useRef, useState } from 'react';
import { useSettingsStore } from '@store/settingsStore';
import { useTaskStore } from '@store/taskStore';
import { showErrorToast, showSuccessToast } from '@store/uiStore';
import { exportData, getStorageInfo, importData } from '@services/storageService';
import styles from './SettingsPage.module.css';

type ThemeMode = 'auto' | 'day' | 'night';

interface SelectCardProps {
  icon: string;
  title: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}

function SelectCard({ icon, title, description, isSelected, onClick }: SelectCardProps) {
  return (
    <button
      type="button"
      className={`${styles.selectCard} ${isSelected ? styles.selectedCard : ''}`}
      onClick={onClick}
      aria-pressed={isSelected}
    >
      <span className={styles.cardIcon} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.cardText}>
        <strong>{title}</strong>
        <span>{description}</span>
      </span>
      {isSelected && <span className={styles.activePill}>Aktywne</span>}
    </button>
  );
}

interface ToggleCardProps {
  icon: string;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}

function ToggleCard({ icon, title, description, enabled, onToggle }: ToggleCardProps) {
  return (
    <button
      type="button"
      className={`${styles.toggleCard} ${enabled ? styles.toggleEnabled : ''}`}
      onClick={onToggle}
      aria-pressed={enabled}
    >
      <span className={styles.cardIcon} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.cardText}>
        <strong>{title}</strong>
        <span>{description}</span>
      </span>
      <span className={`${styles.switchBadge} ${enabled ? styles.switchOn : styles.switchOff}`}>
        {enabled ? 'Włączone' : 'Wyłączone'}
      </span>
    </button>
  );
}

export default function SettingsPage() {
  const {
    nightMode,
    screensaver,
    display,
    isNightModeActive,
    updateNightMode,
    updateScreensaver,
    updateDisplay,
    toggleKidsMode,
    setKidsModePin,
    resetSettings,
    loadSettings,
  } = useSettingsStore();
  const { loadTasks, loadCompletions } = useTaskStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const storageInfo = getStorageInfo();

  const currentThemeMode: ThemeMode =
    nightMode.mode === 'auto' ? 'auto' : nightMode.enabled ? 'night' : 'day';

  const storageUsedKb = Math.round(storageInfo.used / 1024);
  const storageAvailableKb = Math.max(0, Math.round(storageInfo.available / 1024));

  const handleThemeChange = (mode: ThemeMode) => {
    if (mode === 'auto') {
      updateNightMode({ mode: 'auto' });
      return;
    }

    updateNightMode({ mode: 'manual', enabled: mode === 'night' });
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'clickido-backup.json';
    link.click();
    URL.revokeObjectURL(url);

    setImportSummary('Backup został przygotowany do pobrania.');
    showSuccessToast('Wyeksportowano backup JSON.');
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
        showErrorToast('Import danych nie powiódł się.');
        return;
      }

      loadTasks();
      loadCompletions();
      loadSettings();

      setImportSummary(`Zaimportowano dane z pliku: ${file.name}`);
      showSuccessToast('Zaimportowano dane z backupu.');
    } catch (error) {
      console.error('Import failed:', error);
      setImportSummary('Wystąpił błąd podczas odczytu pliku importu.');
      showErrorToast('Nie udało się odczytać pliku.');
    } finally {
      event.target.value = '';
    }
  };

  const handleToggleKidsMode = () => {
    if (!display.kidsMode) {
      const result = toggleKidsMode();

      if (!result.success) {
        showErrorToast('Nie udało się włączyć trybu dziecięcego.');
        return;
      }

      if (!display.kidsModePin) {
        const pin = window.prompt(
          'Ustaw opcjonalny PIN rodzica do wyjścia z trybu dziecięcego. Wpisz 4 cyfry albo zostaw puste pole.'
        );

        if (pin) {
          const saved = setKidsModePin(pin.trim());
          if (!saved) {
            showErrorToast('PIN musi mieć dokładnie 4 cyfry.');
          } else {
            showSuccessToast('Tryb dziecięcy został włączony i zabezpieczony PIN-em.');
            return;
          }
        }
      }

      showSuccessToast('Tryb dziecięcy został włączony.');
      return;
    }

    const pin = display.kidsModePin
      ? window.prompt('Podaj 4-cyfrowy PIN rodzica, aby wyłączyć tryb dziecięcy.')
      : undefined;

    const result = toggleKidsMode(pin ?? undefined);

    if (!result.success) {
      showErrorToast('Nieprawidłowy PIN rodzica.');
      return;
    }

    showSuccessToast('Powrót do trybu dla dorosłych został odblokowany.');
  };

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Sterowanie aplikacją</p>
        <h1>Ustawienia</h1>
        <p>
          Ten ekran ma służyć do szybkich decyzji. Widać od razu, co jest aktywne, a mniej ważne
          rzeczy są schowane niżej.
        </p>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <h2>Wygląd aplikacji</h2>
            <p>Wybierz jeden z trzech prostych trybów wyglądu.</p>
          </div>
          <span className={styles.inlineBadge}>
            {isNightModeActive ? 'Teraz aktywny wygląd nocny' : 'Teraz aktywny wygląd dzienny'}
          </span>
        </div>

        <div className={styles.selectGrid}>
          <SelectCard
            icon="🕒"
            title="Automatycznie"
            description={`Przełącza wygląd według godzin ${nightMode.startHour}:00-${nightMode.endHour}:00.`}
            isSelected={currentThemeMode === 'auto'}
            onClick={() => handleThemeChange('auto')}
          />
          <SelectCard
            icon="☀️"
            title="Jasny"
            description="Czytelny wygląd na dzień i jasne pomieszczenia."
            isSelected={currentThemeMode === 'day'}
            onClick={() => handleThemeChange('day')}
          />
          <SelectCard
            icon="🌙"
            title="Nocny"
            description="Spokojniejszy wygląd na wieczór i noc."
            isSelected={currentThemeMode === 'night'}
            onClick={() => handleThemeChange('night')}
          />
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <h2>Tryb dziecięcy i prostota</h2>
            <p>Najważniejsze rzeczy dla domu i dzieci w jednym miejscu.</p>
          </div>
          <span className={styles.inlineBadge}>
            {display.kidsMode ? 'Tryb dziecięcy aktywny' : 'Tryb standardowy'}
          </span>
        </div>

        <div className={styles.kidsSpotlight}>
          <div className={styles.kidsSpotlightCopy}>
            <strong>🧸 Tryb dziecięcy</strong>
            <span>
              Uproszczona nawigacja, większe kafle, mniej tekstu i łatwiejsze klikanie dla dzieci.
            </span>
          </div>
          <button
            type="button"
            className={`${styles.primaryAction} ${display.kidsMode ? styles.primaryActionMuted : ''}`}
            onClick={handleToggleKidsMode}
          >
            {display.kidsMode ? 'Wyłącz tryb dziecięcy' : 'Włącz tryb dziecięcy'}
          </button>
        </div>

        <div className={styles.toggleGrid}>
          <ToggleCard
            icon="⏱️"
            title="Szacowany czas"
            description="Pokazuje ile mniej więcej trwa dane zadanie."
            enabled={display.showTimeEstimate}
            onToggle={() => updateDisplay({ showTimeEstimate: !display.showTimeEstimate })}
          />
          <ToggleCard
            icon="⭐"
            title="Punkty przy zadaniach"
            description="Pokazuje punkty na kartach zadań i ekranie wyników."
            enabled={display.showPoints}
            onToggle={() => updateDisplay({ showPoints: !display.showPoints })}
          />
          <ToggleCard
            icon="💬"
            title="Baner motywacyjny"
            description="Dodaje prosty komunikat o postępie dnia."
            enabled={display.showMotivation}
            onToggle={() => updateDisplay({ showMotivation: !display.showMotivation })}
          />
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <h2>Wygaszacz i ekran</h2>
            <p>Tu ustawiasz tylko to, co naprawdę przydaje się na tablecie domowym.</p>
          </div>
          <span className={styles.inlineBadge}>
            {screensaver.enabled ? `Wygaszacz po ${screensaver.idleTimeoutMinutes} min` : 'Wygaszacz wyłączony'}
          </span>
        </div>

        <div className={styles.toggleGrid}>
          <ToggleCard
            icon="🖥️"
            title="Wygaszacz"
            description="Uruchamia ekran spoczynkowy po bezczynności."
            enabled={screensaver.enabled}
            onToggle={() => updateScreensaver({ enabled: !screensaver.enabled })}
          />
          <ToggleCard
            icon="⏰"
            title="Sekundy na zegarze"
            description="Dokładniejszy zegar, ale bardziej ruchomy ekran."
            enabled={screensaver.showSeconds}
            onToggle={() => updateScreensaver({ showSeconds: !screensaver.showSeconds })}
          />
        </div>

        <div className={styles.choiceRow}>
          <span className={styles.choiceLabel}>Po ilu minutach ma się włączyć wygaszacz?</span>
          <div className={styles.choiceButtons}>
            {[1, 3, 5, 10, 15].map((minutes) => (
              <button
                key={minutes}
                type="button"
                className={`${styles.choiceButton} ${
                  screensaver.idleTimeoutMinutes === minutes ? styles.choiceButtonActive : ''
                }`}
                onClick={() => updateScreensaver({ idleTimeoutMinutes: minutes })}
              >
                {minutes} min
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <h2>Dane i backup</h2>
            <p>Rzeczy techniczne są na końcu i nie przeszkadzają w codziennym użyciu.</p>
          </div>
          <span className={styles.inlineBadge}>localStorage</span>
        </div>

        <dl className={styles.storageGrid}>
          <div>
            <dt>Zajęte miejsce</dt>
            <dd>{storageUsedKb} KB</dd>
          </div>
          <div>
            <dt>Wolne miejsce</dt>
            <dd>{storageAvailableKb} KB</dd>
          </div>
        </dl>

        <div className={styles.utilityActions}>
          <button type="button" className={styles.utilityButton} onClick={handleExport}>
            📤 Eksportuj backup
          </button>
          <button type="button" className={styles.utilityButton} onClick={handleOpenImport}>
            📥 Importuj backup
          </button>
          <button type="button" className={styles.utilityButton} onClick={resetSettings}>
            🔄 Resetuj ustawienia
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
