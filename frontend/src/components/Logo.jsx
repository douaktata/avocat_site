export function LogoIcon({ size = 24, className = '' }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      width={size}
      height={size}
      className={className}
    >
      <path d="M24 4v36M18 40h12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M12 16h24" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M12 16l-4 10c0 3 3.5 5 4 5s4-2 4-5l-4-10z" fill="rgba(255,255,255,0.25)" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M36 16l-4 10c0 3 3.5 5 4 5s4-2 4-5l-4-10z" fill="rgba(255,255,255,0.25)" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx="24" cy="8" r="3" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="1.5"/>
    </svg>
  );
}

export default function Logo() {
  return (
    <div style={{ textAlign: 'center' }}>
      <div className="logo-icon">
        <LogoIcon size={48} />
      </div>
    </div>
  );
}
