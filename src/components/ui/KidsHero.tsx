import { useMemo } from 'react';
import styles from './KidsHero.module.css';

interface KidsHeroProps {
  done: number;
  total: number;
  points: number;
}

export default function KidsHero({ done, total, points }: KidsHeroProps) {
  const percentage = total === 0 ? 0 : Math.round((done / total) * 100);
  const remaining = Math.max(0, total - done);

  const mood = useMemo(() => {
    if (total === 0) return 'start';
    if (remaining === 0) return 'done';
    if (percentage >= 60) return 'excited';
    if (percentage >= 30) return 'happy';
    return 'start';
  }, [total, remaining, percentage]);

  const bubbleText = useMemo(() => {
    if (total === 0) return 'Dodaj zadania!';
    if (remaining === 0) return 'Wszystko gotowe!';
    if (remaining === 1) return 'Jeszcze jedno!';
    return `Zostały ${remaining} zadania`;
  }, [total, remaining]);

  return (
    <div className={`${styles.hero} ${styles[mood]}`}>
      <div className={styles.pointsBadge} aria-label={`${points} punktów dziś`}>
        <svg className={styles.starIcon} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7L12 17.8 5.7 21.2l1.7-7L2 9.5l7.1-.6z" />
        </svg>
        <span>{points}</span>
      </div>

      <div className={`${styles.companion} ${styles[`mood-${mood}`]}`} aria-hidden="true">
        <div className={styles.face}>
          <div className={styles.eyes}>
            <span />
            <span />
          </div>
          <div className={styles.mouth} data-mood={mood} />
          {mood === 'excited' && (
            <>
              <div className={`${styles.cheek} ${styles.cheekL}`} />
              <div className={`${styles.cheek} ${styles.cheekR}`} />
            </>
          )}
          {mood === 'done' && (
            <>
              <div className={`${styles.sparkle} ${styles.s1}`}>✦</div>
              <div className={`${styles.sparkle} ${styles.s2}`}>✦</div>
            </>
          )}
        </div>
      </div>

      <div className={styles.bubble}>
        <strong>{bubbleText}</strong>
      </div>

      <div className={styles.segments} role="progressbar" aria-valuenow={done} aria-valuemax={total}>
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} className={`${styles.segment} ${i < done ? styles.lit : ''}`}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7L12 17.8 5.7 21.2l1.7-7L2 9.5l7.1-.6z" />
            </svg>
          </span>
        ))}
      </div>
    </div>
  );
}
