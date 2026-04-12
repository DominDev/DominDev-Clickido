import { useEffect, useMemo, useState } from 'react';
import { CategoryId } from '@/types';
import { useTaskStore } from '@store/taskStore';
import { calculatePoints } from '@services/taskService';
import { getItem, setItem, STORAGE_KEYS } from '@services/storageService';
import { CATEGORIES, TASK_TEMPLATES } from '@utils/categories';
import styles from './OnboardingFlow.module.css';

type Step = 'welcome' | 'templates';

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

  const selectedTasksCount = useMemo(() => {
    return selectedCategories.reduce((sum, categoryId) => sum + TASK_TEMPLATES[categoryId].length, 0);
  }, [selectedCategories]);

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
        {step === 'welcome' ? (
          <>
            <div className={styles.hero}>🏠</div>
            <p className={styles.eyebrow}>Witamy w Clickido</p>
            <h2 id="onboarding-title" className={styles.title}>
              Twoja domowa tablica zadań
            </h2>
            <p className={styles.description}>
              Ustaw szybki start dla całej rodziny. Możesz od razu dodać gotowe zestawy
              obowiązków albo zacząć od pustej tablicy.
            </p>

            <div className={styles.actions}>
              <button type="button" className={styles.secondaryButton} onClick={closeOnboarding}>
                Pomiń na razie
              </button>
              <button type="button" className={styles.primaryButton} onClick={() => setStep('templates')}>
                Zaczynamy
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
              Wybierz obszary domu. Clickido doda gotowe zestawy zadań, żeby od razu było z czego
              korzystać.
            </p>

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
                Dodaj wybrane
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
