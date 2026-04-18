import { useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { useSettingsStore } from '@store/settingsStore';
import { useTaskStore } from '@store/taskStore';
import { showErrorToast, showSuccessToast, useUIStore } from '@store/uiStore';
import { clearAll, exportData, getStorageInfo, importData } from '@services/storageService';
import { ClearDataModal, ParentPinModal, PinModal } from '@components/ui';
import styles from './SettingsPage.module.css';

type ThemeMode = 'auto' | 'day' | 'night';
type PinEditorMode = 'set' | 'change' | null;

interface ThemeOptionCardProps {
  icon: string;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

function ThemeOptionCard({
  icon,
  title,
  description,
  selected,
  onClick,
}: ThemeOptionCardProps) {
  return (
    <button
      type="button"
      className={`${styles.themeCard} ${selected ? styles.themeCardActive : ''}`}
      onClick={onClick}
      role="radio"
      aria-checked={selected}
    >
      <span className={styles.themeCardIcon} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.themeCardText}>
        <strong>{title}</strong>
        <span>{description}</span>
      </span>
      {selected && <span className={styles.themeCardBadge}>Aktywny</span>}
    </button>
  );
}

interface SwitchRowProps {
  icon: string;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}

function SwitchRow({ icon, title, description, enabled, onToggle }: SwitchRowProps) {
  return (
    <button
      type="button"
      className={styles.switchRow}
      onClick={onToggle}
      role="switch"
      aria-checked={enabled}
    >
      <span className={styles.rowIcon} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.rowText}>
        <strong>{title}</strong>
        <span>{description}</span>
      </span>
      <span className={`${styles.switchControl} ${enabled ? styles.switchControlOn : ''}`}>
        <span className={styles.switchThumb} />
      </span>
    </button>
  );
}

interface ActionRowProps {
  icon: string;
  title: string;
  description: string;
  children: ReactNode;
}

function ActionRow({ icon, title, description, children }: ActionRowProps) {
  return (
    <div className={styles.actionRow}>
      <span className={styles.rowIcon} aria-hidden="true">
        {icon}
      </span>
      <div className={styles.rowText}>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      <div className={styles.rowActions}>{children}</div>
    </div>
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
  const { loadTasks, loadCompletions, loadRewardClaims, loadRewards } = useTaskStore();
  const activateScreensaver = useUIStore((state) => state.activateScreensaver);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const [pinEditorMode, setPinEditorMode] = useState<PinEditorMode>(null);
  const [exitPinOpen, setExitPinOpen] = useState(false);
  const [clearDataOpen, setClearDataOpen] = useState(false);
  const storageInfo = getStorageInfo();

  const currentThemeMode: ThemeMode =
    nightMode.mode === 'auto' ? 'auto' : nightMode.enabled ? 'night' : 'day';

  const storageUsedKb = Math.round(storageInfo.used / 1024);
  const storageAvailableKb = Math.max(0, Math.round(storageInfo.available / 1024));
  const shouldShowKidsModeBanner = display.kidsMode && !display.kidsModePin;

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

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
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
      loadRewards();
      loadRewardClaims();
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

      showSuccessToast(
        display.kidsModePin
          ? 'Tryb dziecięcy został włączony i pozostaje chroniony PIN-em rodzica.'
          : 'Tryb dziecięcy został włączony.'
      );
      return;
    }

    if (display.kidsModePin) {
      setExitPinOpen(true);
      return;
    }

    const result = toggleKidsMode();

    if (!result.success) {
      showErrorToast('Nie udało się wyłączyć trybu dziecięcego.');
      return;
    }

    showSuccessToast('Powrót do trybu dla dorosłych został odblokowany.');
  };

  const handleConfirmExitKidsMode = (pin: string): boolean => {
    const result = toggleKidsMode(pin.trim());

    if (!result.success) {
      showErrorToast('Nieprawidłowy PIN rodzica.');
      return false;
    }

    setExitPinOpen(false);
    showSuccessToast('Powrót do trybu dla dorosłych został odblokowany.');
    return true;
  };

  const handleSaveParentPin = (pin: string): { success: boolean; error?: string } => {
    const saved = setKidsModePin(pin);

    if (!saved) {
      return {
        success: false,
        error: 'PIN musi mieć dokładnie 4 cyfry.',
      };
    }

    showSuccessToast(
      pinEditorMode === 'change'
        ? 'PIN rodzica został zmieniony.'
        : 'PIN rodzica został ustawiony.'
    );

    return { success: true };
  };

  const handleClearPin = () => {
    clearKidsModePin();
    showSuccessToast('PIN rodzica został usunięty.');
  };

  const handleResetSettings = () => {
    resetSettings();
    showSuccessToast('Przywrócono domyślne ustawienia aplikacji.');
  };

  const handleClearAllData = () => {
    const cleared = clearAll();

    if (!cleared) {
      showErrorToast('Nie udało się usunąć lokalnych danych aplikacji.');
      return;
    }

    window.location.reload();
  };

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Sterowanie aplikacją</p>
        <h1 className={styles.title}>Ustawienia</h1>
        <p className={styles.subtitle}>
          Najważniejsze decyzje są na górze. Rzadziej używane rzeczy schodzą niżej i nie
          przeszkadzają w codziennym użyciu aplikacji.
        </p>
      </header>

      {shouldShowKidsModeBanner && (
        <div className={styles.contextBanner} role="status" aria-live="polite">
          <div className={styles.contextBannerCopy}>
            <strong>Tryb dziecka jest aktywny bez zabezpieczenia PIN-em.</strong>
            <span>Ustaw PIN rodzica, aby dziecko nie mogło samodzielnie wrócić do pełnego widoku.</span>
          </div>
          <button
            type="button"
            className={styles.utilityButton}
            onClick={() => setPinEditorMode('set')}
          >
            Ustaw PIN
          </button>
        </div>
      )}

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <h2>Tryb aplikacji</h2>
            <p>Najważniejsze ustawienia wpływające na codzienny sposób używania Clickido.</p>
          </div>
          <span className={styles.inlineBadge}>
            {display.kidsMode ? 'Widok uproszczony aktywny' : 'Pełny widok zarządzania'}
          </span>
        </div>

        <div className={styles.featureCard}>
          <div className={styles.featureCardCopy}>
            <span className={styles.featureEyebrow}>Tryb dziecięcy</span>
            <strong>{display.kidsMode ? 'Aplikacja działa teraz w trybie dziecka' : 'Aplikacja działa teraz w trybie rodzica'}</strong>
            <p>
              {display.kidsMode
                ? 'Nawigacja jest uproszczona, elementy są większe, a dziecko widzi tylko najważniejsze ekrany.'
                : 'Widoczne są wszystkie narzędzia zarządzania, ustawienia i bardziej rozbudowane opcje aplikacji.'}
            </p>
          </div>
          <button
            type="button"
            className={`${styles.primaryAction} ${display.kidsMode ? styles.primaryActionMuted : ''}`}
            onClick={handleToggleKidsMode}
          >
            {display.kidsMode ? 'Wyłącz tryb dziecięcy' : 'Włącz tryb dziecięcy'}
          </button>
        </div>

        <div className={styles.settingsList}>
          <ActionRow
            icon="🔐"
            title="PIN rodzica"
            description={
              display.kidsModePin
                ? 'PIN chroni wyjście z trybu dziecięcego w ustawieniach i w górnym pasku aplikacji.'
                : 'PIN nie jest jeszcze ustawiony. Dziecko może wrócić do pełnego widoku bez dodatkowej blokady.'
            }
          >
            <button
              type="button"
              className={styles.utilityButton}
              onClick={() => setPinEditorMode(display.kidsModePin ? 'change' : 'set')}
            >
              {display.kidsModePin ? 'Zmień PIN' : 'Ustaw PIN'}
            </button>
            {display.kidsModePin && (
              <button type="button" className={styles.utilityButton} onClick={handleClearPin}>
                Usuń PIN
              </button>
            )}
          </ActionRow>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <h2>Wygląd i czytelność</h2>
            <p>Ustawienia wpływające na to, jak aplikacja wygląda i ile informacji pokazuje na co dzień.</p>
          </div>
          <span className={styles.inlineBadge}>
            {isNightModeActive ? 'Teraz aktywny wygląd nocny' : 'Teraz aktywny wygląd dzienny'}
          </span>
        </div>

        <div className={styles.themeGrid} role="radiogroup" aria-label="Tryb wyglądu aplikacji">
          <ThemeOptionCard
            icon="🕒"
            title="Automatycznie"
            description={`Zmienia motyw według godzin ${nightMode.startHour}:00-${nightMode.endHour}:00.`}
            selected={currentThemeMode === 'auto'}
            onClick={() => handleThemeChange('auto')}
          />
          <ThemeOptionCard
            icon="☀️"
            title="Jasny"
            description="Czytelny motyw na dzień i jasne pomieszczenia."
            selected={currentThemeMode === 'day'}
            onClick={() => handleThemeChange('day')}
          />
          <ThemeOptionCard
            icon="🌙"
            title="Nocny"
            description="Spokojniejszy motyw na wieczór i ciemniejsze wnętrza."
            selected={currentThemeMode === 'night'}
            onClick={() => handleThemeChange('night')}
          />
        </div>

        <div className={styles.settingsList} aria-label="Opcje widoku">
          <SwitchRow
            icon="⏱️"
            title="Pokazuj szacowany czas"
            description="Na kartach zadań pojawia się przewidywany czas wykonania."
            enabled={display.showTimeEstimate}
            onToggle={() => updateDisplay({ showTimeEstimate: !display.showTimeEstimate })}
          />
          <SwitchRow
            icon="⭐"
            title="Pokazuj punkty przy zadaniach"
            description="Punkty są widoczne na kartach zadań i na ekranie punktów."
            enabled={display.showPoints}
            onToggle={() => updateDisplay({ showPoints: !display.showPoints })}
          />
          <SwitchRow
            icon="💬"
            title="Pokazuj baner motywacyjny"
            description="Na widoku dnia pojawia się prosty komunikat o postępie."
            enabled={display.showMotivation}
            onToggle={() => updateDisplay({ showMotivation: !display.showMotivation })}
          />
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <h2>Ekran spoczynkowy</h2>
            <p>Ustawienia związane z wygaszaczem i zachowaniem tabletu podczas bezczynności.</p>
          </div>
          <span className={styles.inlineBadge}>
            {screensaver.enabled ? `Wygaszacz po ${screensaver.idleTimeoutMinutes} min` : 'Wygaszacz wyłączony'}
          </span>
        </div>

        <div className={styles.settingsList}>
          <SwitchRow
            icon="🖥️"
            title="Włącz wygaszacz"
            description="Uruchamia ekran spoczynkowy po bezczynności tabletu."
            enabled={screensaver.enabled}
            onToggle={() => updateScreensaver({ enabled: !screensaver.enabled })}
          />
        </div>

        {screensaver.enabled ? (
          <div className={styles.screensaverPanel}>
            <div className={styles.choiceRow}>
              <span className={styles.choiceLabel}>Po ilu minutach włączyć wygaszacz?</span>
              <div
                className={styles.choiceButtons}
                role="radiogroup"
                aria-label="Czas bezczynności do włączenia wygaszacza"
              >
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

            <div className={styles.sliderPanel}>
              <div className={styles.sliderHeader}>
                <span className={styles.choiceLabel}>Jasność ekranu w wygaszaczu</span>
                <span className={styles.sliderValue}>{screensaver.panelBrightness}%</span>
              </div>
              <input
                className={styles.sliderInput}
                type="range"
                min="0"
                max="100"
                step="1"
                value={screensaver.panelBrightness}
                onChange={(event) =>
                  updateScreensaver({ panelBrightness: Number(event.target.value) })
                }
                aria-label="Jasność ekranu w wygaszaczu"
              />
              <div className={styles.sliderMarks} aria-hidden="true">
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
              </div>
              <p className={styles.sliderHint}>
                Niższa wartość daje spokojniejszy i mniej świecący ekran spoczynkowy.
              </p>
            </div>

            <div className={styles.settingsList}>
              <SwitchRow
                icon="⏰"
                title="Pokazuj sekundy na zegarze"
                description="Zegar jest dokładniejszy, ale ekran wydaje się bardziej dynamiczny."
                enabled={screensaver.showSeconds}
                onToggle={() => updateScreensaver({ showSeconds: !screensaver.showSeconds })}
              />
            </div>

            <div className={styles.previewRow}>
              <div className={styles.previewCopy}>
                <strong>Podgląd wygaszacza</strong>
                <span>Sprawdź wygląd bez czekania na bezczynność.</span>
              </div>
              <button type="button" className={styles.utilityButton} onClick={activateScreensaver}>
                Uruchom podgląd
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.inlineInfo}>
            <strong>Wygaszacz jest wyłączony.</strong>
            <span>Włącz go, aby ustawić czas bezczynności, jasność i wygląd zegara.</span>
          </div>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <h2>Dane i backup</h2>
            <p>Kopia danych, przywracanie aplikacji i rzadziej używane akcje administracyjne.</p>
          </div>
          <span className={styles.inlineBadge}>administracja</span>
        </div>

        <div className={styles.dataPanel}>
          <div className={styles.dataPanelHeader}>
            <div className={styles.dataPanelCopy}>
              <strong>Zarządzanie danymi aplikacji</strong>
              <span>Eksportuj kopię bezpieczeństwa, przywróć zapisany stan albo zresetuj konfigurację.</span>
            </div>
            <dl className={styles.storageMeta} aria-label="Informacje o pamięci">
              <div className={styles.storageStat}>
                <dt>Zajęte miejsce</dt>
                <dd>{storageUsedKb} KB</dd>
              </div>
              <div className={styles.storageStat}>
                <dt>Wolne miejsce</dt>
                <dd>{storageAvailableKb} KB</dd>
              </div>
            </dl>
          </div>

          <div className={styles.dataActions}>
            <ActionRow
              icon="📤"
              title="Eksportuj backup"
              description="Pobiera pełną kopię danych aplikacji do pliku JSON."
            >
              <button type="button" className={styles.utilityButton} onClick={handleExport}>
                Eksportuj
              </button>
            </ActionRow>

            <ActionRow
              icon="📥"
              title="Importuj backup"
              description="Przywraca dane aplikacji z wcześniej zapisanego pliku JSON."
            >
              <button type="button" className={styles.utilityButton} onClick={handleOpenImport}>
                Importuj
              </button>
            </ActionRow>
          </div>

          {importSummary && <p className={styles.helpText}>{importSummary}</p>}

          <div className={styles.dataDivider} aria-hidden="true" />

          <div className={styles.dangerRow}>
            <div className={styles.dangerIcon} aria-hidden="true">
              🗑️
            </div>
            <div className={styles.dangerCopy}>
              <strong>Usuń wszystkie dane z urządzenia</strong>
              <span>Kasuje zadania, historię, nagrody, ustawienia i onboarding zapisane lokalnie.</span>
            </div>
            <button type="button" className={styles.dangerButton} onClick={() => setClearDataOpen(true)}>
              Usuń dane
            </button>
          </div>

          <div className={styles.dataDivider} aria-hidden="true" />

          <div className={styles.dangerRow}>
            <div className={styles.dangerIcon} aria-hidden="true">
              ↺
            </div>
            <div className={styles.dangerCopy}>
              <strong>Reset ustawień</strong>
              <span>Przywraca domyślną konfigurację wyglądu, wygaszacza i trybu aplikacji.</span>
            </div>
            <button type="button" className={styles.dangerButton} onClick={handleResetSettings}>
              Resetuj ustawienia
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className={styles.hiddenInput}
          onChange={handleImportFile}
        />
      </section>

      <PinModal
        isOpen={exitPinOpen}
        onClose={() => setExitPinOpen(false)}
        onSubmit={handleConfirmExitKidsMode}
        title="Wyjdź z trybu dziecięcego"
        description="Aby wrócić do pełnego widoku zarządzania aplikacją, wpisz PIN rodzica."
        submitLabel="Wyjdź"
      />

      <ClearDataModal
        isOpen={clearDataOpen}
        onClose={() => setClearDataOpen(false)}
        onConfirm={handleClearAllData}
      />

      <ParentPinModal
        isOpen={pinEditorMode !== null}
        title={pinEditorMode === 'change' ? 'Zmień PIN rodzica' : 'Ustaw PIN rodzica'}
        description="PIN jest używany tylko do ochrony wyjścia z trybu dziecięcego."
        submitLabel={pinEditorMode === 'change' ? 'Zapisz nowy PIN' : 'Ustaw PIN'}
        onClose={() => setPinEditorMode(null)}
        onSubmit={handleSaveParentPin}
      />
    </section>
  );
}
