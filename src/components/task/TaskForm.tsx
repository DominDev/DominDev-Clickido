/**
 * TaskForm - Bottom sheet modal for adding/editing tasks
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { RecurrenceType, CategoryId } from '@/types';
import { useTaskStore } from '@store/taskStore';
import { useUIStore, showSuccessToast, showErrorToast } from '@store/uiStore';
import { CATEGORIES, getAllEmojis, getTemplatesForCategory } from '@utils/categories';
import { calculatePoints } from '@services/taskService';
import styles from './TaskForm.module.css';

const TIME_PRESETS = [5, 10, 15, 30, 45, 60];
const DAYS_OF_WEEK = [
  { value: 1, label: 'Pn' },
  { value: 2, label: 'Wt' },
  { value: 3, label: 'Śr' },
  { value: 4, label: 'Cz' },
  { value: 5, label: 'Pt' },
  { value: 6, label: 'So' },
  { value: 0, label: 'Nd' },
];

export default function TaskForm() {
  const { addTask, updateTask, selectedDate } = useTaskStore();
  const { modal, closeModal, editingTask } = useUIStore();

  const isEditing = !!editingTask;
  const isOpen = modal.isOpen && modal.type === 'taskForm';

  // Form state
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('📋');
  const [category, setCategory] = useState<CategoryId>('other');
  const [estimatedMinutes, setEstimatedMinutes] = useState(15);
  const [recurrence, setRecurrence] = useState<RecurrenceType>('once');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [intervalDays, setIntervalDays] = useState(2);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [date, setDate] = useState(format(selectedDate, 'yyyy-MM-dd'));

  // Calculate points
  const points = useMemo(() => calculatePoints(estimatedMinutes), [estimatedMinutes]);

  // Reset form when opening/closing
  useEffect(() => {
    if (isOpen) {
      if (editingTask) {
        // Populate form with existing task data
        setTitle(editingTask.title);
        setEmoji(editingTask.emoji);
        setCategory(editingTask.category);
        setEstimatedMinutes(editingTask.estimatedMinutes);
        setRecurrence(editingTask.recurrence);
        setDaysOfWeek(editingTask.daysOfWeek || []);
        setIntervalDays(editingTask.intervalDays || 2);
        setDayOfMonth(editingTask.dayOfMonth || 1);
        setDate(editingTask.date || format(selectedDate, 'yyyy-MM-dd'));
      } else {
        // Reset to defaults
        setTitle('');
        setEmoji('📋');
        setCategory('other');
        setEstimatedMinutes(15);
        setRecurrence('once');
        setDaysOfWeek([]);
        setIntervalDays(2);
        setDayOfMonth(1);
        setDate(format(selectedDate, 'yyyy-MM-dd'));
      }
    }
  }, [isOpen, editingTask, selectedDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showErrorToast('Podaj nazwę zadania');
      return;
    }

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
      dayOfMonth: recurrence === 'monthly' ? dayOfMonth : undefined,
      date: recurrence === 'once' ? date : undefined,
    };

    if (isEditing && editingTask) {
      updateTask(editingTask.id, taskData);
      showSuccessToast('Zadanie zaktualizowane');
    } else {
      addTask(taskData);
      showSuccessToast('Zadanie dodane');
    }

    closeModal();
  };

  const handleTemplateSelect = (template: { title: string; emoji: string; category: CategoryId; estimatedMinutes: number }) => {
    setTitle(template.title);
    setEmoji(template.emoji);
    setCategory(template.category);
    setEstimatedMinutes(template.estimatedMinutes);
  };

  const toggleDayOfWeek = (day: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const templates = useMemo(() => getTemplatesForCategory(category), [category]);
  const allEmojis = useMemo(() => getAllEmojis(), []);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          />

          {/* Bottom Sheet */}
          <motion.div
            className={styles.sheet}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className={styles.handle} />

            <form onSubmit={handleSubmit} className={styles.form}>
              <h2 className={styles.title}>
                {isEditing ? 'Edytuj zadanie' : 'Nowe zadanie'}
              </h2>

              {/* Title input */}
              <div className={styles.field}>
                <label htmlFor="task-title" className={styles.label}>
                  Nazwa zadania
                </label>
                <input
                  id="task-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={styles.input}
                  placeholder="np. Umyj naczynia"
                  autoFocus
                />
              </div>

              {/* Emoji picker */}
              <div className={styles.field}>
                <label className={styles.label}>Ikona</label>
                <div className={styles.emojiGrid}>
                  {allEmojis.slice(0, 24).map((e) => (
                    <button
                      key={e}
                      type="button"
                      className={`${styles.emojiBtn} ${emoji === e ? styles.selected : ''}`}
                      onClick={() => setEmoji(e)}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category pills */}
              <div className={styles.field}>
                <label className={styles.label}>Kategoria</label>
                <div className={styles.pills}>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`${styles.pill} ${category === cat.id ? styles.selected : ''}`}
                      onClick={() => setCategory(cat.id)}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Templates */}
              {!isEditing && templates.length > 1 && (
                <div className={styles.field}>
                  <label className={styles.label}>Szablony</label>
                  <div className={styles.pills}>
                    {templates.slice(0, 5).map((t, i) => (
                      <button
                        key={i}
                        type="button"
                        className={styles.pill}
                        onClick={() => handleTemplateSelect(t)}
                      >
                        {t.emoji} {t.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Time presets */}
              <div className={styles.field}>
                <label className={styles.label}>
                  Szacowany czas: {estimatedMinutes} min
                </label>
                <div className={styles.timePresets}>
                  {TIME_PRESETS.map((time) => (
                    <button
                      key={time}
                      type="button"
                      className={`${styles.timeBtn} ${estimatedMinutes === time ? styles.selected : ''}`}
                      onClick={() => setEstimatedMinutes(time)}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Points display */}
              <div className={styles.pointsDisplay}>
                Punkty: <strong>{points}</strong>
              </div>

              {/* Recurrence */}
              <div className={styles.field}>
                <label className={styles.label}>Powtarzanie</label>
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                  className={styles.select}
                >
                  <option value="once">Jednorazowo</option>
                  <option value="daily">Codziennie</option>
                  <option value="weekly">Co tydzień</option>
                  <option value="interval">Co X dni</option>
                  <option value="monthly">Co miesiąc</option>
                </select>
              </div>

              {/* Recurrence options */}
              {recurrence === 'once' && (
                <div className={styles.field}>
                  <label htmlFor="task-date" className={styles.label}>Data</label>
                  <input
                    id="task-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
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
                        className={`${styles.dayBtn} ${daysOfWeek.includes(day.value) ? styles.selected : ''}`}
                        onClick={() => toggleDayOfWeek(day.value)}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {recurrence === 'interval' && (
                <div className={styles.field}>
                  <label htmlFor="interval-days" className={styles.label}>
                    Co ile dni: {intervalDays}
                  </label>
                  <input
                    id="interval-days"
                    type="range"
                    min="2"
                    max="30"
                    value={intervalDays}
                    onChange={(e) => setIntervalDays(Number(e.target.value))}
                    className={styles.slider}
                  />
                </div>
              )}

              {recurrence === 'monthly' && (
                <div className={styles.field}>
                  <label htmlFor="day-of-month" className={styles.label}>
                    Dzień miesiąca (1-28)
                  </label>
                  <input
                    id="day-of-month"
                    type="number"
                    min="1"
                    max="28"
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(Number(e.target.value))}
                    className={styles.input}
                  />
                </div>
              )}

              {/* Actions */}
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={closeModal}
                >
                  Anuluj
                </button>
                <button type="submit" className={styles.submitBtn}>
                  {isEditing ? 'Zapisz' : 'Dodaj'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
