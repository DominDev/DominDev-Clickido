import { useEffect, useMemo, useState } from 'react';
import { CategoryId } from '@/types';
import { useTaskStore } from '@store/taskStore';
import { calculatePoints } from '@services/taskService';
import { getItem, setItem, STORAGE_KEYS } from '@services/storageService';
import { CATEGORIES, TASK_TEMPLATES } from '@utils/categories';
import styles from './OnboardingFlow.module.css';

type Step = 'welcome' | 'install' | 'templates';
type InstallState = 'checking' | 'standalone' | 'installable' | 'ios' | 'android' | 'browser';

type DeferredInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const TEMPLATE_SCHEDULES: Record<
  CategoryId,
  Partial<{
    recurrence: 'daily' | 'weekly';
    daysOfWeek: number[];
  }>
> = {
  kitchen: { recurrence: 'daily' },
  bathroom: { recurrence: 'weekly', daysOfWeek: [2, 5] },
  living: { recurrence: 'weekly', daysOfWeek: [1, 4] },
  laundry: { recurrence: 'weekly', daysOfWeek: [3, 6] },
  shopping: { recurrence: 'weekly', daysOfWeek: [6] },
  pets: { recurrence: 'daily' },
  other: { recurrence: 'daily' },
};

export default function OnboardingFlow() {
  const { tasks, addTask } = useTaskStore();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>('welcome');
  const [installState, setInstallState] = useState<InstallState>('checking');
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<DeferredInstallPrompt | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<CategoryId[]>([
    'kitchen',
    'bathroom',
    'living',
  ]);

  useEffect(() => {
    const isComplete = getItem(STORAGE_KEYS.ONBOARDING_COMPLETE, false);

    if (isComplete) {
      setIsOpen(false);
      return;
    }

    if (tasks.length > 0) {
      setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, true);
      setIsOpen(false);
      return;
    }

    setIsOpen(true);
  }, [tasks.length]);

  useEffect(() => {
    const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || navigatorWithStandalone.standalone === true;

    if (isStandalone) {
      setInstallState('standalone');
      return;
    }

    const userAgent = window.navigator.userAgent.toLowerCase();

    if (/iphone|ipad|ipod/.test(userAgent)) {
      setInstallState('ios');
    } else if (/android/.test(userAgent)) {
      setInstallState('android');
    } else {
      setInstallState('browser');
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredInstallPrompt(event as DeferredInstallPrompt);
      setInstallState('installable');
    };

    const handleAppInstalled = () => {
      setDeferredInstallPrompt(null);
      setInstallState('standalone');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const selectedTasksCount = useMemo(() => {
    return selectedCategories.reduce((sum, categoryId) => sum + TASK_TEMPLATES[categoryId].length, 0);
  }, [selectedCategories]);

  const selectedLabels = useMemo(() => {
    return CATEGORIES.filter((category) => selectedCategories.includes(category.id)).map(
      (category) => category.label
    );
  }, [selectedCategories]);

  const installContent = useMemo(() => {
    switch (installState) {
      case 'standalone':
        return {
          badge: 'Już gotowe',
          title: 'Clickido działa już jak aplikacja',
          description:
            'Na tym urządzeniu wszystko jest ustawione tak, jak trzeba. Najwygodniej otwieraj Clickido z ikony na ekranie głównym.',
          helper:
            'Nie musisz robić nic więcej. Możesz od razu przejść do dodania pierwszych zadań.',
          actionLabel: 'Dalej do zadań',
          emoji: '✅',
        };
      case 'installable':
        return {
          badge: 'Można zainstalować',
          title: 'Dodaj Clickido do ekranu głównego',
          description:
            'To najlepszy sposób używania aplikacji na tablecie. Po dodaniu ikony całość wygląda czyściej i mniej przypomina zwykłą stronę w przeglądarce.',
          helper:
            'Kliknij przycisk instalacji. Jeśli nie chcesz robić tego teraz, nadal możesz przejść dalej i wrócić do tego później.',
          actionLabel: 'Zainstaluj teraz',
          emoji: '📥',
        };
      case 'ios':
        return {
          badge: 'iPhone lub iPad',
          title: 'Na tym urządzeniu użyj opcji „Do ekranu głównego”',
          description:
            'Na urządzeniach Apple zwykle nie ma jednego dużego przycisku instalacji. Po prostu użyj menu „Udostępnij”, a potem „Do ekranu głównego”.',
          helper:
            'To normalne zachowanie. Najważniejsze jest późniejsze uruchamianie Clickido z ikony, a nie z paska adresu.',
          actionLabel: 'Rozumiem, dalej',
          emoji: '📱',
        };
      case 'android':
        return {
          badge: 'Android',
          title: 'Najpewniej da się dodać Clickido jak aplikację',
          description:
            'Na wielu tabletach Androida przeglądarka pokazuje przycisk instalacji. Jeśli nie, użyj menu przeglądarki i wybierz „Dodaj do ekranu głównego” albo „Zainstaluj”.',
          helper:
            'Nazwy mogą się trochę różnić zależnie od urządzenia, ale cel jest ten sam: uruchamianie z ikony.',
          actionLabel: 'Dalej',
          emoji: '📲',
        };
      case 'browser':
      case 'checking':
      default:
        return {
          badge: 'Przeglądarka',
          title: 'Możesz korzystać już teraz',
          description:
            'Jeśli jesteś na komputerze albo przeglądarka nie wspiera instalacji, aplikacja nadal działa normalnie. Na tablecie warto potem dodać ją jako skrót albo ikonę.',
          helper:
            'To krok wygody, a nie warunek działania. Najpierw uruchom i sprawdź, czy układ Ci odpowiada.',
          actionLabel: 'Dalej',
          emoji: '💡',
        };
    }
  }, [installState]);

  const toggleCategory = (categoryId: CategoryId) => {
    setSelectedCategories((current) =>
      current.includes(categoryId)
        ? current.filter((item) => item !== categoryId)
        : [...current, categoryId]
    );
  };

  const closeOnboarding = () => {
    setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, true);
    setIsOpen(false);
  };

  const handleInstallNow = async () => {
    if (!deferredInstallPrompt) {
      setStep('templates');
      return;
    }

    await deferredInstallPrompt.prompt();
    const result = await deferredInstallPrompt.userChoice;

    if (result.outcome === 'accepted') {
      setInstallState('standalone');
    }

    setStep('templates');
  };

  const handleImportTemplates = () => {
    selectedCategories.forEach((categoryId) => {
      const schedule = TEMPLATE_SCHEDULES[categoryId];

      TASK_TEMPLATES[categoryId].forEach((template) => {
        addTask({
          ...template,
          points: calculatePoints(template.estimatedMinutes),
          recurrence: schedule.recurrence ?? 'daily',
          daysOfWeek: schedule.daysOfWeek,
        });
      });
    });

    closeOnboarding();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className={styles.card}>
        <div className={styles.stepRow}>
          <span className={styles.stepBadge}>
            {step === 'welcome' ? 'Krok 1 z 3' : step === 'install' ? 'Krok 2 z 3' : 'Krok 3 z 3'}
          </span>

          {step !== 'welcome' ? (
            <button
              type="button"
              className={styles.backButton}
              onClick={() => setStep(step === 'templates' ? 'install' : 'welcome')}
            >
              Wróć
            </button>
          ) : null}
        </div>

        {step === 'welcome' ? (
          <>
            <div className={styles.hero}>🌟</div>
            <p className={styles.eyebrow}>Pierwsze uruchomienie</p>
            <h2 id="onboarding-title" className={styles.title}>
              Ustawmy Clickido na dobry start
            </h2>
            <p className={styles.description}>
              Ten krótki start pokaże Ci, jak najlepiej używać aplikacji na tablecie i pozwoli od razu
              dodać pierwsze gotowe zadania dla domu.
            </p>

            <div className={styles.benefits}>
              <article className={styles.benefitCard}>
                <span className={styles.benefitEmoji} aria-hidden="true">
                  ⚡
                </span>
                <div>
                  <strong>Szybki start</strong>
                  <span>Nie musisz ustawiać wszystkiego ręcznie. Za chwilę możesz dodać gotowe zestawy.</span>
                </div>
              </article>

              <article className={styles.benefitCard}>
                <span className={styles.benefitEmoji} aria-hidden="true">
                  📲
                </span>
                <div>
                  <strong>Najlepiej działa z ikony</strong>
                  <span>Pokażę Ci, jak używać Clickido bardziej jak aplikacji niż zwykłej strony.</span>
                </div>
              </article>

              <article className={styles.benefitCard}>
                <span className={styles.benefitEmoji} aria-hidden="true">
                  🧒
                </span>
                <div>
                  <strong>Gotowe też dla dzieci</strong>
                  <span>Duże kafelki, punkty i prosty układ są przygotowane do wspólnego korzystania.</span>
                </div>
              </article>

              <article className={styles.benefitCard}>
                <span className={styles.benefitEmoji} aria-hidden="true">
                  💾
                </span>
                <div>
                  <strong>Dane zostają na urządzeniu</strong>
                  <span>Aplikacja działa lokalnie, więc później warto pamiętać o backupie w ustawieniach.</span>
                </div>
              </article>
            </div>

            <div className={styles.actions}>
              <button type="button" className={styles.secondaryButton} onClick={closeOnboarding}>
                Pomiń na razie
              </button>
              <button type="button" className={styles.primaryButton} onClick={() => setStep('install')}>
                Dalej
              </button>
            </div>
          </>
        ) : step === 'install' ? (
          <>
            <p className={styles.eyebrow}>{installContent.badge}</p>
            <h2 id="onboarding-title" className={styles.title}>
              {installContent.title}
            </h2>
            <p className={styles.description}>{installContent.description}</p>

            <div className={styles.installPanel}>
              <article className={styles.installCard}>
                <span className={styles.installEmoji} aria-hidden="true">
                  {installContent.emoji}
                </span>
                <div>
                  <strong>Dlaczego to ma znaczenie?</strong>
                  <span>{installContent.helper}</span>
                </div>
              </article>

              <div className={styles.installChecklist}>
                <div className={styles.installChecklistItem}>
                  <span className={styles.installChecklistNumber}>1</span>
                  <span>Najwygodniej uruchamiać Clickido z ikony na ekranie głównym.</span>
                </div>
                <div className={styles.installChecklistItem}>
                  <span className={styles.installChecklistNumber}>2</span>
                  <span>Jeśli zostajesz w przeglądarce, aplikacja nadal działa, ale mniej przypomina osobny program.</span>
                </div>
                <div className={styles.installChecklistItem}>
                  <span className={styles.installChecklistNumber}>3</span>
                  <span>Później i tak możesz wrócić do ustawień oraz backupu, więc ten krok nie blokuje dalszej pracy.</span>
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              <button type="button" className={styles.secondaryButton} onClick={() => setStep('templates')}>
                Pomiń ten krok
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={installState === 'installable' ? handleInstallNow : () => setStep('templates')}
              >
                {installContent.actionLabel}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className={styles.eyebrow}>Gotowe zestawy</p>
            <h2 id="onboarding-title" className={styles.title}>
              Dodaj pierwsze zadania
            </h2>
            <p className={styles.description}>
              Wybierz obszary domu. Clickido doda gotowe zestawy zadań, żeby od razu było z czego korzystać.
            </p>

            <div className={styles.selectionSummary}>
              <strong>Wybrane obszary:</strong>
              <div className={styles.selectionPills}>
                {selectedLabels.length > 0 ? (
                  selectedLabels.map((label) => (
                    <span key={label} className={styles.selectionPill}>
                      {label}
                    </span>
                  ))
                ) : (
                  <span className={styles.selectionEmpty}>Wybierz przynajmniej jeden zestaw.</span>
                )}
              </div>
            </div>

            <div className={styles.templateGrid}>
              {CATEGORIES.filter((category) => category.id !== 'other').map((category) => {
                const isSelected = selectedCategories.includes(category.id);
                const templatesCount = TASK_TEMPLATES[category.id].length;

                return (
                  <button
                    key={category.id}
                    type="button"
                    className={`${styles.templateCard} ${isSelected ? styles.templateCardSelected : ''}`}
                    onClick={() => toggleCategory(category.id)}
                    aria-pressed={isSelected}
                  >
                    <span className={styles.templateEmoji}>{category.emoji}</span>
                    <span className={styles.templateName}>{category.label}</span>
                    <span className={styles.templateMeta}>{templatesCount} zadań</span>
                  </button>
                );
              })}
            </div>

            <p className={styles.counter}>
              Wybrano {selectedCategories.length} zestawy • {selectedTasksCount} zadań do importu
            </p>

            <div className={styles.actions}>
              <button type="button" className={styles.secondaryButton} onClick={closeOnboarding}>
                Start od pustej tablicy
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleImportTemplates}
                disabled={selectedCategories.length === 0}
              >
                Dodaj {selectedTasksCount} zadań
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
