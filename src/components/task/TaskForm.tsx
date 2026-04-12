/**
 * TaskForm - Bottom sheet modal for adding/editing tasks
 */

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { format } from 'date-fns';
import { CategoryId, RecurrenceType } from '@/types';
import { useTaskStore } from '@store/taskStore';
import { useUIStore, showErrorToast, showSuccessToast, showUndoToast } from '@store/uiStore';
import {
  CATEGORIES,
  getAllEmojis,
  getCategoryById,
  getTemplatesForCategory,
} from '@utils/categories';
import { calculatePoints } from '@services/taskService';
import styles from './TaskForm.module.css';

const TIME_PRESETS = [5, 10, 15, 20, 30, 45, 60];
const RECURRENCE_OPTIONS: Array<{ value: RecurrenceType; label: string; hint: string }> = [
  { value: 'once', label: 'Raz', hint: 'Na konkretny dzień' },
  { value: 'daily', label: 'Codziennie', hint: 'Pojawia się każdego dnia' },
  { value: 'weekly', label: 'Tydzień', hint: 'W wybrane dni tygodnia' },
  { value: 'interval', label: 'Co kilka dni', hint: 'Regularny odstęp dni' },
  { value: 'monthly', label: 'Miesiąc', hint: 'Stały dzień miesiąca' },
];
const DAYS_OF_WEEK = [
  { value: 1, label: 'Pn' },
  { value: 2, label: 'Wt' },
  { value: 3, label: 'Śr' },
  { value: 4, label: 'Cz' },
  { value: 5, label: 'Pt' },
  { value: 6, label: 'So' },
  { value: 0, label: 'Nd' },
];
const DEFAULT_EMOJI = '📋';

export default function TaskForm() {
  const { addTask, updateTask, deleteTask, restoreTask, completions, selectedDate } = useTaskStore();
  const { modal, closeModal, editingTask } = useUIStore();

  const isEditing = !!editingTask;
  const isOpen = modal.isOpen && modal.type === 'taskForm';

  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState(DEFAULT_EMOJI);
  const [category, setCategory] = useState<CategoryId>('other');
  const [estimatedMinutes, setEstimatedMinutes] = useState(15);
  const [recurrence, setRecurrence] = useState<RecurrenceType>('once');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [intervalDays, setIntervalDays] = useState(2);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [date, setDate] = useState(format(selectedDate, 'yyyy-MM-dd'));

  const points = useMemo(() => calculatePoints(estimatedMinutes), [estimatedMinutes]);
  const templates = useMemo(() => getTemplatesForCategory(category), [category]);
  const allEmojis = useMemo(() => getAllEmojis(), []);
  const selectedCategory = useMemo(() => getCategoryById(category), [category]);
  const recurringHint = useMemo(
    () => RECURRENCE_OPTIONS.find((option) => option.value === recurrence)?.hint ?? '',
    [recurrence]
  );

  useEffect(() => {
    if (!isOpen) return;

    if (editingTask) {
      setTitle(editingTask.title);
      setEmoji(editingTask.emoji);
      setCategory(editingTask.category);
      setEstimatedMinutes(editingTask.estimatedMinutes);
      setRecurrence(editingTask.recurrence);
      setDaysOfWeek(editingTask.daysOfWeek || []);
      setIntervalDays(editingTask.intervalDays || 2);
      setDayOfMonth(editingTask.dayOfMonth || 1);
      setDate(editingTask.date || editingTask.intervalStartDate || format(selectedDate, 'yyyy-MM-dd'));
      return;
    }

    setTitle('');
    setEmoji(DEFAULT_EMOJI);
    setCategory('other');
    setEstimatedMinutes(15);
    setRecurrence('once');
    setDaysOfWeek([]);
    setIntervalDays(2);
    setDayOfMonth(1);
    setDate(format(selectedDate, 'yyyy-MM-dd'));
  }, [isOpen, editingTask, selectedDate]);

  const toggleDayOfWeek = (day: number) => {
    setDaysOfWeek((previous) =>
      previous.includes(day)
        ? previous.filter((value) => value !== day)
        : [...previous, day].sort((a, b) => {
            const order = [1, 2, 3, 4, 5, 6, 0];
            return order.indexOf(a) - order.indexOf(b);
          })
    );
  };

  const handleTemplateSelect = (template: {
    title: string;
    emoji: string;
    category: CategoryId;
    estimatedMinutes: number;
  }) => {
    setTitle(template.title);
    setEmoji(template.emoji);
    setCategory(template.category);
    setEstimatedMinutes(template.estimatedMinutes);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!title.trim()) {
      showErrorToast('Podaj nazwę zadania.');
      return;
    }

    if (recurrence === 'weekly' && daysOfWeek.length === 0) {
      showErrorToast('Wybierz co najmniej jeden dzień tygodnia.');
      return;
    }

    const normalizedDayOfMonth = Math.min(28, Math.max(1, dayOfMonth || 1));

    const taskData = {
      title: title.trim(),
      emoji,
      category,
      estimatedMinutes,
      points,
      recurrence,
      daysOfWeek: recurrence === 'weekly' ? daysOfWeek : undefined,
      intervalDays: recurrence === 'interval' ? intervalDays : undefined,
      intervalStartDate: recurrence === 'interval' ? date : undefined,
      dayOfMonth: recurrence === 'monthly' ? normalizedDayOfMonth : undefined,
      date: recurrence === 'once' ? date : undefined,
    };

    if (isEditing && editingTask) {
      updateTask(editingTask.id, taskData);
      showSuccessToast('Zadanie zostało zapisane.');
    } else {
      addTask(taskData);
      showSuccessToast('Zadanie zostało dodane.');
    }

    closeModal();
  };

  const handleDelete = () => {
    if (!editingTask) {
      return;
    }

    const completionsToRestore = completions.filter((entry) => entry.taskId === editingTask.id);
    const deleted = deleteTask(editingTask.id);

    if (!deleted) {
      showErrorToast('Nie udało się usunąć zadania.');
      return;
    }

    closeModal();

    showUndoToast(`Usunięto zadanie: ${editingTask.title}`, () => {
      restoreTask(editingTask, completionsToRestore);
      showSuccessToast(`Przywrócono zadanie: ${editingTask.title}`);
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          />

          <motion.div
            className={styles.sheet}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-form-title"
          >
            <div className={styles.handle} />

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.header}>
                <div>
                  <p className={styles.eyebrow}>{isEditing ? 'Edycja zadania' : 'Nowe zadanie'}</p>
                  <h2 id="task-form-title" className={styles.title}>
                    {isEditing ? 'Popraw szczegóły zadania' : 'Dodaj nowe zadanie'}
                  </h2>
                  <p className={styles.subtitle}>
                    Ustaw nazwę, kategorię i sposób powtarzania. Formularz jest zoptymalizowany pod
                    szybkie dodawanie obowiązków na dziś.
                  </p>
                </div>

                <button
                  type="button"
                  className={styles.closeButton}
                  onClick={closeModal}
                  aria-label="Zamknij formularz"
                >
                  ×
                </button>
              </div>

              <div className={styles.previewCard}>
                <div className={styles.previewEmoji}>{emoji}</div>
                <div className={styles.previewContent}>
                  <strong className={styles.previewTitle}>
                    {title.trim() || 'Podgląd nowego zadania'}
                  </strong>
                  <span className={styles.previewMeta}>
                    {selectedCategory?.emoji} {selectedCategory?.label} · {estimatedMinutes} min · {points}{' '}
                    pkt
                  </span>
                </div>
              </div>

              <div className={styles.section}>
                <div className={styles.field}>
                  <label htmlFor="task-title" className={styles.label}>
                    Nazwa zadania
                  </label>
                  <input
                    id="task-title"
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className={styles.input}
                    placeholder="Na przykład: wynieś śmieci"
                    autoFocus
                    maxLength={60}
                  />
                  <span className={styles.helpText}>
                    Krótka, konkretna nazwa działa najlepiej na liście i w trybie dziecięcym.
                  </span>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Kategoria</label>
                  <div className={styles.pills}>
                    {CATEGORIES.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`${styles.pill} ${category === item.id ? styles.selected : ''}`}
                        onClick={() => setCategory(item.id)}
                      >
                        <span>{item.emoji}</span>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {!isEditing && templates.length > 0 && (
                  <div className={styles.field}>
                    <label className={styles.label}>Szybkie szablony</label>
                    <div className={styles.templateGrid}>
                      {templates.slice(0, 6).map((template) => (
                        <button
                          key={`${template.category}-${template.title}`}
                          type="button"
                          className={styles.templateCard}
                          onClick={() => handleTemplateSelect(template)}
                        >
                          <span className={styles.templateEmoji}>{template.emoji}</span>
                          <span className={styles.templateTitle}>{template.title}</span>
                          <span className={styles.templateMeta}>{template.estimatedMinutes} min</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>Wygląd zadania</h3>
                  <span className={styles.sectionHint}>To zobaczą domownicy na liście.</span>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Ikona</label>
                  <div className={styles.emojiGrid}>
                    {allEmojis.slice(0, 28).map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={`${styles.emojiBtn} ${emoji === item ? styles.selected : ''}`}
                        onClick={() => setEmoji(item)}
                        aria-label={`Wybierz ikonę ${item}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Szacowany czas</label>
                  <div className={styles.timePresets}>
                    {TIME_PRESETS.map((time) => (
                      <button
                        key={time}
                        type="button"
                        className={`${styles.timeBtn} ${estimatedMinutes === time ? styles.selected : ''}`}
                        onClick={() => setEstimatedMinutes(time)}
                      >
                        {time} min
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.pointsDisplay}>
                  <span className={styles.pointsLabel}>Wartość zadania</span>
                  <strong className={styles.pointsValue}>{points} pkt</strong>
                </div>
              </div>

              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>Kiedy zadanie ma się pojawiać</h3>
                  <span className={styles.sectionHint}>{recurringHint}</span>
                </div>

                <div className={styles.recurrenceGrid}>
                  {RECURRENCE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`${styles.recurrenceCard} ${
                        recurrence === option.value ? styles.selected : ''
                      }`}
                      onClick={() => setRecurrence(option.value)}
                    >
                      <strong>{option.label}</strong>
                      <span>{option.hint}</span>
                    </button>
                  ))}
                </div>

                {recurrence === 'once' && (
                  <div className={styles.field}>
                    <label htmlFor="task-date" className={styles.label}>
                      Data wykonania
                    </label>
                    <input
                      id="task-date"
                      type="date"
                      value={date}
                      onChange={(event) => setDate(event.target.value)}
                      className={styles.input}
                    />
                  </div>
                )}

                {recurrence === 'weekly' && (
                  <div className={styles.field}>
                    <label className={styles.label}>Dni tygodnia</label>
                    <div className={styles.daysOfWeek}>
                      {DAYS_OF_WEEK.map((day) => (
                        <button
                          key={day.value}
                          type="button"
                          className={`${styles.dayBtn} ${
                            daysOfWeek.includes(day.value) ? styles.selected : ''
                          }`}
                          onClick={() => toggleDayOfWeek(day.value)}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {recurrence === 'interval' && (
                  <>
                    <div className={styles.field}>
                      <label htmlFor="interval-days" className={styles.label}>
                        Odstęp między wykonaniami: co {intervalDays} dni
                      </label>
                      <input
                        id="interval-days"
                        type="range"
                        min="2"
                        max="30"
                        value={intervalDays}
                        onChange={(event) => setIntervalDays(Number(event.target.value))}
                        className={styles.slider}
                      />
                    </div>
                    <div className={styles.field}>
                      <label htmlFor="interval-start-date" className={styles.label}>
                        Pierwszy dzień cyklu
                      </label>
                      <input
                        id="interval-start-date"
                        type="date"
                        value={date}
                        onChange={(event) => setDate(event.target.value)}
                        className={styles.input}
                      />
                    </div>
                  </>
                )}

                {recurrence === 'monthly' && (
                  <div className={styles.field}>
                    <label htmlFor="day-of-month" className={styles.label}>
                      Dzień miesiąca
                    </label>
                    <input
                      id="day-of-month"
                      type="number"
                      min="1"
                      max="28"
                      value={dayOfMonth}
                      onChange={(event) => setDayOfMonth(Number(event.target.value))}
                      className={styles.input}
                    />
                    <span className={styles.helpText}>
                      Zakres 1-28 zapobiega problemom w krótszych miesiącach.
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.actions}>
                <button type="button" className={styles.cancelBtn} onClick={closeModal}>
                  Anuluj
                </button>
                {isEditing && (
                  <button type="button" className={styles.deleteBtn} onClick={handleDelete}>
                    Usuń zadanie
                  </button>
                )}
                <button type="submit" className={styles.submitBtn}>
                  {isEditing ? 'Zapisz zmiany' : 'Dodaj zadanie'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
