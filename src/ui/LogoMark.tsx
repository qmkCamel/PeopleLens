interface LogoMarkProps {
  className?: string;
  title?: string;
}

export function LogoMark({ className, title = "PeopleLens" }: LogoMarkProps) {
  return (
    <svg className={className} viewBox="0 0 128 128" role="img" aria-label={title}>
      <rect x="8" y="8" width="112" height="112" rx="30" fill="#8b9588" />
      <path d="M77 76 L101 100" fill="none" stroke="#f4efe6" strokeLinecap="round" strokeWidth="12" />
      <circle cx="56" cy="54" r="36" fill="#8b9588" />
      <circle cx="56" cy="54" r="31" fill="none" stroke="#f4efe6" strokeWidth="10" />
      <path
        d="M49 51 L64 44 L70 63"
        fill="none"
        stroke="#f4efe6"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4"
      />
      <circle cx="49" cy="51" r="7" fill="#c3a392" />
      <circle cx="64" cy="44" r="6" fill="#e3d0bf" />
      <circle cx="70" cy="63" r="7" fill="#b7a6a2" />
      <circle cx="56" cy="54" r="24" fill="none" stroke="#6f7b71" strokeOpacity="0.38" strokeWidth="2" />
    </svg>
  );
}
