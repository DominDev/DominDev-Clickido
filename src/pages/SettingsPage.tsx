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
      role="radio"
      aria-checked={isSelected}
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
      role="switch"
      aria-checked={enabled}
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
    clearKidsModePin,
    resetSettings,
    loadSettings,
  } = useSettingsStore();
  const { loadTasks, loadCompletions } = useTaskStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const [pinEditorMode, setPinEditorMode] = useState<'set' | 'change' | null>(null);
  const [pinDraft, setPinDraft] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [exitPinOpen, setExitPinOpen] = useState(false);
  const [exitPinDraft, setExitPinDraft] = useState('');
  const [exitPinError, setExitPinError] = useState<string | null>(null);
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
      setExitPinOpen(false);
      setExitPinDraft('');
      setExitPinError(null);
      const result = toggleKidsMode();

      if (!result.success) {
        showErrorToast('Nie udało się włączyć trybu dziecięcego.');
        return;
      }

      showSuccessToast(
        display.kidsModePin
          ? 'Tryb dziecięcy został włączony i pozostaje chroniony PIN-em rodzica.'
          : 'Tryb dziecięcy został włączony.'
      );
      return;
    }

    if (display.kidsModePin) {
      setExitPinOpen(true);
      setExitPinDraft('');
      setExitPinError(null);
      return;
    }

    const result = toggleKidsMode();

    if (!result.success) {
      showErrorToast('Nie udało się wyłączyć trybu dziecięcego.');
      return;
    }

    showSuccessToast('Powrót do trybu dla dorosłych został odblokowany.');
  };

  const openPinEditor = (mode: 'set' | 'change') => {
    setExitPinOpen(false);
    setExitPinDraft('');
    setExitPinError(null);
    setPinDraft('');
    setPinError(null);
    setPinEditorMode(mode);
  };

  const closePinEditor = () => {
    setPinDraft('');
    setPinError(null);
    setPinEditorMode(null);
  };

  const closeExitPinPanel = () => {
    setExitPinOpen(false);
    setExitPinDraft('');
    setExitPinError(null);
  };

  const handleConfirmExitKidsMode = () => {
    const result = toggleKidsMode(exitPinDraft.trim());

    if (!result.success) {
      setExitPinError('Nieprawidłowy PIN rodzica.');
      showErrorToast('Nieprawidłowy PIN rodzica.');
      return;
    }

    closeExitPinPanel();
    showSuccessToast('Powrót do trybu dla dorosłych został odblokowany.');
  };

  const handleSavePin = () => {
    const saved = setKidsModePin(pinDraft.trim());

    if (!saved) {
      setPinError('PIN musi mieć dokładnie 4 cyfry.');
      return;
    }

    showSuccessToast(display.kidsModePin ? 'PIN rodzica został zmieniony.' : 'PIN rodzica został ustawiony.');
    closePinEditor();
  };

  const handleClearPin = () => {
    clearKidsModePin();
    closePinEditor();
    showSuccessToast('PIN rodzica został usunięty.');
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

      <section className={styles.statusOverview} aria-label="Szybkie podsumowanie ustawień">
        <article className={styles.statusCard}>
          <span className={styles.statusLabel}>Wygląd</span>
          <strong className={styles.statusValue}>
            {currentThemeMode === 'auto'
              ? 'Automatyczny'
              : currentThemeMode === 'night'
                ? 'Nocny'
                : 'Jasny'}
          </strong>
          <span className={styles.statusHint}>
            {isNightModeActive ? 'Teraz aplikacja jest ciemniejsza.' : 'Teraz aplikacja jest jasna.'}
          </span>
        </article>

        <article className={styles.statusCard}>
          <span className={styles.statusLabel}>Tryb pracy</span>
          <strong className={styles.statusValue}>
            {display.kidsMode ? 'Dziecko' : 'Rodzic'}
          </strong>
          <span className={styles.statusHint}>
            {display.kidsMode
              ? display.kidsModePin
                ? 'Wyjście jest chronione PIN-em rodzica.'
                : 'Wyjście z trybu dziecięcego nie wymaga PIN-u.'
              : 'Widoczne są wszystkie narzędzia zarządzania.'}
          </span>
        </article>

        <article className={styles.statusCard}>
          <span className={styles.statusLabel}>Wygaszacz</span>
          <strong className={styles.statusValue}>
            {screensaver.enabled ? `${screensaver.idleTimeoutMinutes} min` : 'Wyłączony'}
          </strong>
          <span className={styles.statusHint}>
            {screensaver.enabled
              ? screensaver.showSeconds
                ? 'Pokazuje sekundy i reaguje po bezczynności.'
                : 'Spokojny tryb z prostym zegarem i statusem dnia.'
              : 'Ekran pozostaje stale aktywny.'}
          </span>
        </article>
      </section>

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

        <div className={styles.selectGrid} role="radiogroup" aria-label="Tryb wyglądu aplikacji">
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

        <p className={styles.helpText}>
          {display.kidsMode
            ? display.kidsModePin
              ? 'Aktywny PIN rodzica chroni wyjście z trybu dziecięcego także z górnego paska aplikacji i z tego ekranu.'
              : 'Tryb dziecięcy jest aktywny, ale nie ma jeszcze ustawionego PIN-u rodzica.'
            : 'Po włączeniu trybu dziecięcego nawigacja uprości się do najważniejszych ekranów.'}
        </p>

        {exitPinOpen && (
          <div className={styles.pinEditor} role="group" aria-label="Wyjście z trybu dziecięcego">
            <label className={styles.pinField}>
              <span className={styles.pinLabel}>PIN rodzica</span>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                maxLength={4}
                className={styles.pinInput}
                value={exitPinDraft}
                onChange={(event) => {
                  setExitPinDraft(event.target.value.replace(/\D/g, '').slice(0, 4));
                  if (exitPinError) {
                    setExitPinError(null);
                  }
                }}
                placeholder="1234"
              />
            </label>

            <div className={styles.pinActions}>
              <button type="button" className={styles.primaryAction} onClick={handleConfirmExitKidsMode}>
                Wyjdź z trybu dziecięcego
              </button>
              <button type="button" className={styles.utilityButton} onClick={closeExitPinPanel}>
                Anuluj
              </button>
            </div>

            <p className={styles.pinHint}>
              Podaj PIN rodzica, aby wrócić do pełnego widoku zarządzania aplikacją.
            </p>
            {exitPinError && <p className={styles.pinError}>{exitPinError}</p>}
          </div>
        )}

        <div className={styles.parentTools}>
          <div className={styles.parentToolsCopy}>
            <strong>🔐 Zabezpieczenie rodzica</strong>
            <span>
              {display.kidsModePin
                ? 'PIN jest aktywny. Rodzic musi go podać, aby wyjść z trybu dziecięcego.'
                : 'PIN nie jest ustawiony. Wyjście z trybu dziecięcego nie jest jeszcze chronione.'}
            </span>
          </div>
          <div className={styles.parentToolsActions}>
            <button type="button" className={styles.utilityButton} onClick={() => openPinEditor(display.kidsModePin ? 'change' : 'set')}>
              {display.kidsModePin ? 'Zmień PIN' : 'Ustaw PIN'}
            </button>
            {display.kidsModePin && (
              <button type="button" className={styles.utilityButton} onClick={handleClearPin}>
                Usuń PIN
              </button>
            )}
          </div>
        </div>

        {pinEditorMode && (
          <div className={styles.pinEditor} role="group" aria-label="Edycja PIN-u rodzica">
            <label className={styles.pinField}>
              <span className={styles.pinLabel}>
                {pinEditorMode === 'change' ? 'Nowy PIN rodzica' : 'PIN rodzica'}
              </span>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                maxLength={4}
                className={styles.pinInput}
                value={pinDraft}
                onChange={(event) => {
                  setPinDraft(event.target.value.replace(/\D/g, '').slice(0, 4));
                  if (pinError) {
                    setPinError(null);
                  }
                }}
                placeholder="1234"
              />
            </label>

            <div className={styles.pinActions}>
              <button type="button" className={styles.primaryAction} onClick={handleSavePin}>
                Zapisz PIN
              </button>
              <button type="button" className={styles.utilityButton} onClick={closePinEditor}>
                Anuluj
              </button>
            </div>

            <p className={styles.pinHint}>
              PIN powinien mieć dokładnie 4 cyfry. Służy tylko do wyjścia z trybu dziecięcego.
            </p>
            {pinError && <p className={styles.pinError}>{pinError}</p>}
          </div>
        )}

        <div className={styles.toggleGrid} aria-label="Przełączniki widoku">
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

        <div className={styles.toggleGrid} aria-label="Przełączniki wygaszacza">
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
          <div className={styles.choiceButtons} role="radiogroup" aria-label="Czas bezczynności do włączenia wygaszacza">
            {[1, 3, 5, 10, 15].map((minutes) => (
              <button
                key={minutes}
                type="button"
                role="radio"
                aria-checked={screensaver.idleTimeoutMinutes === minutes}
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

      <details className={styles.advancedSection}>
        <summary className={styles.advancedSummary}>
          <span>
            <strong>Dane i backup</strong>
            <small>Rzadziej używane, techniczne ustawienia</small>
          </span>
          <span className={styles.inlineBadge}>zaawansowane</span>
        </summary>

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
      </details>
    </section>
  );
}
