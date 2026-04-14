interface KidsStarIconProps {
  className?: string;
}

export default function KidsStarIcon({ className }: KidsStarIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      focusable="false"
      aria-hidden="true"
      className={className}
    >
      <path
        d="m12 2.7 2.87 5.82 6.43.94-4.65 4.53 1.1 6.4L12 17.34 6.25 20.4l1.1-6.4L2.7 9.46l6.43-.94L12 2.7Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
