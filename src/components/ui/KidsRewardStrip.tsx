import styles from './KidsRewardStrip.module.css';

interface KidsRewardStripProps {
  title: string;
  currentPoints: number;
  targetPoints: number;
  emoji: string;
}

export default function KidsRewardStrip({ title, currentPoints, targetPoints, emoji }: KidsRewardStripProps) {
  const percentage = Math.min(100, Math.round((currentPoints / targetPoints) * 100));
  const remaining = Math.max(0, targetPoints - currentPoints);

  return (
    <div className={styles.strip} aria-label={`Nagroda: ${title}`}>
      <div className={styles.emojiCard}>{emoji}</div>
      <div className={styles.body}>
        <div className={styles.header}>
          <span className={styles.title}>{title}</span>
          <span className={styles.points}>
            {currentPoints}
            <small className={styles.target}>/{targetPoints}</small>
          </span>
        </div>
        <div className={styles.track}>
          <div className={styles.fill} style={{ width: `${percentage}%` }} />
        </div>
        <span className={styles.footer}>
          {remaining === 0 ? 'Możesz odebrać! 🎁' : `Brakuje jeszcze ${remaining} ⭐`}
        </span>
      </div>
    </div>
  );
}
