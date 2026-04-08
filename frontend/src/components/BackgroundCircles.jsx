export default function BackgroundCircles() {
  return (
    <div className="bg-shapes">
      {/* Scale of justice */}
      <div className="floating-shape shape-1">
        <svg viewBox="0 0 64 64" fill="none">
          <path d="M32 6v50M22 56h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M16 20h32M16 20l-4 14h16L16 20zM48 20l-4 14h16L48 20z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="37" r="6" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
          <circle cx="52" cy="37" r="6" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
        </svg>
      </div>

      {/* Paragraph symbol */}
      <div className="floating-shape shape-2">
        <svg viewBox="0 0 64 64" fill="none">
          <path d="M30 8h14M36 8v48M40 8v48M30 8c-8 0-14 5.4-14 12s6 12 14 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Gavel */}
      <div className="floating-shape shape-3">
        <svg viewBox="0 0 64 64" fill="none">
          <rect x="28" y="6" width="22" height="10" rx="3" transform="rotate(45 39 11)" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M26 38L42 22M18 50l8-8M10 54h44" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Open book */}
      <div className="floating-shape shape-4">
        <svg viewBox="0 0 64 64" fill="none">
          <path d="M32 16c-6-4-14-4-20-2v30c6-2 14-2 20 2 6-4 14-4 20-2V14c-6-2-14-2-20 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M32 16v30" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      </div>

      {/* Column/pillar */}
      <div className="floating-shape shape-5">
        <svg viewBox="0 0 64 64" fill="none">
          <path d="M14 14h36M16 14v36M24 14v36M32 14v36M40 14v36M48 14v36M12 50h40M14 10h36" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Shield with check */}
      <div className="floating-shape shape-6">
        <svg viewBox="0 0 64 64" fill="none">
          <path d="M32 6L10 16v14c0 14 10 22 22 26 12-4 22-12 22-26V16L32 6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M24 32l6 6 12-14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
}
