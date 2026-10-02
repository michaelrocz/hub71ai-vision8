interface ParallelLogoProps {
  size?: 'compact' | 'standard';
  className?: string;
}

export default function ParallelLogo({ size = 'standard', className = '' }: ParallelLogoProps) {
  const iconSize = size === 'compact' ? 34 : 42;

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`} aria-label="PARALLEL">
      <svg width={iconSize} height={iconSize} viewBox="0 0 48 48" fill="none" role="img" aria-hidden="true" className="shrink-0 drop-shadow-[0_2px_8px_rgba(0,0,0,.28)]">
        <defs>
          <linearGradient id="parallel-gold" x1="8" y1="8" x2="40" y2="42" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F2DFB4" />
            <stop offset="1" stopColor="#C3A66D" />
          </linearGradient>
        </defs>
        {/* Twin architectural portals: two futures, held open side by side. */}
        <path d="M9 41V20.5C9 12.49 15.49 6 23.5 6S38 12.49 38 20.5V41" stroke="url(#parallel-gold)" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M16 41V22C16 17.86 19.36 14.5 23.5 14.5S31 17.86 31 22V41" stroke="#F4F0E7" strokeOpacity=".84" strokeWidth="1.7" strokeLinecap="round" />
        {/* Abu Dhabi horizon: a rising sun behind a quiet city line. */}
        <circle cx="23.5" cy="25.5" r="2.5" fill="#E7CC96" />
        <path d="M17 36.5h4v-4.2h4.3v4.2h3.2v-6h4v10.5H17V36.5Z" fill="#6F9690" stroke="#D4C39E" strokeWidth=".8" strokeLinejoin="round" />
        <path d="M6 43.5h32" stroke="#E7CC96" strokeOpacity=".8" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      <span className={`whitespace-nowrap font-semibold text-white ${size === 'compact' ? 'text-[21px] tracking-[.105em]' : 'text-[22px] tracking-[.14em]'}`}>
        PARALLEL<span className="text-[#d8bd82]">.</span>
      </span>
    </div>
  );
}
