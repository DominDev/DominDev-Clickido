import { useMemo } from 'react';
import { useTaskStore } from '@store/taskStore';
import { useUIStore, showInfoToast, showSuccessToast } from '@store/uiStore';
import { calculatePoints } from '@services/taskService';
import { getRecurrenceDescription } from '@utils/recurrence';
import { TASK_TEMPLATES, getCategoryLabel } from '@utils/categories';
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
  const { tasks, addTask, deleteTask } = useTaskStore();
  const { openModal, setEditingTask } = useUIStore();

  const groupedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => a.title.localeCompare(b.title, 'pl'));
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
    const task = groupedTasks.find((item) => item.id === taskId);
    if (!task) {
      return;
    }

    setEditingTask(task);
    openModal('taskForm');
  };

  const handleDeleteTask = (taskId: string, title: string) => {
    const success = deleteTask(taskId);

    if (!success) {
      return;
    }

    showInfoToast(`Usunięto zadanie: ${title}`);
  };

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Zadania</h1>
          <p>
            Roboczy widok bazy zadań. Tworzenie i edycja korzystają już z tego samego
            modalowego flow co widok dnia.
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
          <h2>Brak zapisanych zadań</h2>
          <p>
            Dodaj zestaw startowy albo własne zadanie, aby od razu przetestować widok dnia,
            punkty i odklikiwanie.
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
