import { useMemo, useState } from 'react';
import { CategoryId } from '@/types';
import { useTaskStore } from '@store/taskStore';
import { useUIStore, showSuccessToast, showUndoToast } from '@store/uiStore';
import { calculatePoints } from '@services/taskService';
import { CATEGORIES, TASK_TEMPLATES, getCategoryLabel } from '@utils/categories';
import { getRecurrenceDescription } from '@utils/recurrence';
import styles from './TasksPage.module.css';

const STARTER_TASKS = [
  TASK_TEMPLATES.kitchen[0],
  TASK_TEMPLATES.living[0],
  TASK_TEMPLATES.laundry[0],
];

const QUICK_TEMPLATES = [
  TASK_TEMPLATES.kitchen[3],
  TASK_TEMPLATES.bathroom[0],
  TASK_TEMPLATES.shopping[0],
  TASK_TEMPLATES.pets[2],
];

export default function TasksPage() {
  const { tasks, completions, addTask, deleteTask, restoreTask } = useTaskStore();
  const { openModal, setEditingTask } = useUIStore();
  const [searchValue, setSearchValue] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryId | 'all'>('all');

  const groupedTasks = useMemo(() => {
    const normalizedQuery = searchValue.trim().toLocaleLowerCase('pl');

    return [...tasks]
      .filter((task) => {
        if (activeCategory !== 'all' && task.category !== activeCategory) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        const haystack = `${task.title} ${getCategoryLabel(task.category)}`.toLocaleLowerCase('pl');
        return haystack.includes(normalizedQuery);
      })
      .sort((a, b) => a.title.localeCompare(b.title, 'pl'));
  }, [tasks, searchValue, activeCategory]);

  const categoryCounts = useMemo(() => {
    return CATEGORIES.reduce<Record<string, number>>((acc, category) => {
      acc[category.id] = tasks.filter((task) => task.category === category.id).length;
      return acc;
    }, {});
  }, [tasks]);

  const handleSeedTasks = () => {
    STARTER_TASKS.forEach((template) => {
      addTask({
        ...template,
        points: calculatePoints(template.estimatedMinutes),
        recurrence: 'daily',
      });
    });

    showSuccessToast('Dodano zestaw startowy');
  };

  const handleQuickAdd = (template: (typeof QUICK_TEMPLATES)[number]) => {
    addTask({
      ...template,
      points: calculatePoints(template.estimatedMinutes),
      recurrence: 'daily',
    });

    showSuccessToast(`Dodano: ${template.title}`);
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    openModal('taskForm');
  };

  const handleEditTask = (taskId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      return;
    }

    setEditingTask(task);
    openModal('taskForm');
  };

  const handleDeleteTask = (taskId: string, title: string) => {
    const taskToRestore = tasks.find((task) => task.id === taskId);
    const completionsToRestore = completions.filter((entry) => entry.taskId === taskId);
    const success = deleteTask(taskId);

    if (!success || !taskToRestore) {
      return;
    }

    showUndoToast(`Usunięto zadanie: ${title}`, () => {
      restoreTask(taskToRestore, completionsToRestore);
      showSuccessToast(`Przywrócono zadanie: ${title}`);
    });
  };

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Baza obowiązków</p>
          <h1>Zadania</h1>
          <p>
            Tutaj rodzic buduje i porządkuje bazę zadań dla całej rodziny. Widok dnia korzysta
            później dokładnie z tych pozycji.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.primaryAction} onClick={handleCreateTask}>
            Nowe zadanie
          </button>
          {tasks.length === 0 && (
            <button type="button" className={styles.secondaryAction} onClick={handleSeedTasks}>
              Dodaj zestaw startowy
            </button>
          )}
        </div>
      </div>

      <section className={styles.filtersCard}>
        <div className={styles.filterTopRow}>
          <label className={styles.searchField}>
            <span>Szukaj zadania</span>
            <input
              type="search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Np. naczynia, zakupy, pies"
            />
          </label>

          <div className={styles.summaryCard}>
            <span>Łącznie zadań</span>
            <strong>{tasks.length}</strong>
          </div>
        </div>

        <div className={styles.categoryFilters}>
          <button
            type="button"
            className={`${styles.categoryChip} ${activeCategory === 'all' ? styles.activeChip : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            Wszystkie
          </button>
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`${styles.categoryChip} ${
                activeCategory === category.id ? styles.activeChip : ''
              }`}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.emoji} {category.label} ({categoryCounts[category.id] ?? 0})
            </button>
          ))}
        </div>
      </section>

      <section className={styles.templatesCard}>
        <div className={styles.sectionHeading}>
          <h2>Szybkie dodawanie</h2>
          <span className={styles.inlineBadge}>szablony</span>
        </div>
        <div className={styles.templateList}>
          {QUICK_TEMPLATES.map((template) => (
            <button
              key={`${template.category}-${template.title}`}
              type="button"
              className={styles.templateButton}
              onClick={() => handleQuickAdd(template)}
            >
              <span className={styles.templateEmoji}>{template.emoji}</span>
              <span className={styles.templateText}>
                <strong>{template.title}</strong>
                <span>
                  {getCategoryLabel(template.category)} · {template.estimatedMinutes} min
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {groupedTasks.length === 0 ? (
        <div className={styles.emptyState}>
          <h2>Brak wyników</h2>
          <p>
            Nie znaleziono zadań dla wybranego filtra. Wyczyść wyszukiwanie albo dodaj nową
            pozycję do bazy.
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {groupedTasks.map((task) => (
            <article key={task.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.taskTitleRow}>
                  <span className={styles.emoji}>{task.emoji}</span>
                  <div className={styles.titleBlock}>
                    <h2>{task.title}</h2>
                    <p>{getCategoryLabel(task.category)}</p>
                  </div>
                </div>
                <div className={styles.cardActions}>
                  <span className={styles.points}>+{task.points}</span>
                  <button
                    type="button"
                    className={styles.editAction}
                    onClick={() => handleEditTask(task.id)}
                  >
                    Edytuj
                  </button>
                  <button
                    type="button"
                    className={styles.deleteAction}
                    onClick={() => handleDeleteTask(task.id, task.title)}
                    aria-label={`Usuń zadanie ${task.title}`}
                  >
                    Usuń
                  </button>
                </div>
              </div>

              <dl className={styles.metaGrid}>
                <div>
                  <dt>Czas</dt>
                  <dd>{task.estimatedMinutes} min</dd>
                </div>
                <div>
                  <dt>Powtarzalność</dt>
                  <dd>{getRecurrenceDescription(task)}</dd>
                </div>
                <div>
                  <dt>Utworzono</dt>
                  <dd>{new Date(task.createdAt).toLocaleDateString('pl-PL')}</dd>
                </div>
                <div>
                  <dt>ID</dt>
                  <dd className={styles.mono}>{task.id}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
