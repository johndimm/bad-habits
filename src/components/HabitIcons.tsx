export function EspressoIcon({ size = 64 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Steam */}
      <path
        d="M22 18C22 14 25 12 25 8"
        stroke="#A0845C"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M30 16C30 12 33 10 33 6"
        stroke="#A0845C"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M38 18C38 14 41 12 41 8"
        stroke="#A0845C"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
      {/* Cup body */}
      <rect x="14" y="22" width="36" height="28" rx="4" fill="#6F4E37" />
      {/* Coffee surface */}
      <rect x="14" y="22" width="36" height="8" rx="4" fill="#4A3120" />
      {/* Handle */}
      <path
        d="M50 30C56 30 58 36 58 40C58 44 56 48 50 48"
        stroke="#6F4E37"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      {/* Saucer */}
      <ellipse cx="32" cy="54" rx="24" ry="4" fill="#8B6914" opacity="0.3" />
    </svg>
  );
}

export function BeerIcon({ size = 64 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Glass body */}
      <path
        d="M12 12L16 56H44L48 12H12Z"
        fill="#F9A825"
        opacity="0.85"
      />
      {/* Foam */}
      <ellipse cx="30" cy="12" rx="20" ry="6" fill="#FFF9C4" />
      <ellipse cx="24" cy="10" rx="5" ry="3" fill="white" opacity="0.7" />
      <ellipse cx="36" cy="9" rx="6" ry="3" fill="white" opacity="0.6" />
      <ellipse cx="30" cy="11" rx="4" ry="2.5" fill="white" opacity="0.5" />
      {/* Bubbles */}
      <circle cx="24" cy="30" r="1.5" fill="white" opacity="0.4" />
      <circle cx="32" cy="38" r="1" fill="white" opacity="0.3" />
      <circle cx="28" cy="44" r="1.5" fill="white" opacity="0.4" />
      <circle cx="36" cy="28" r="1" fill="white" opacity="0.3" />
      {/* Glass highlight */}
      <path
        d="M16 14L18 52"
        stroke="white"
        strokeWidth="2"
        opacity="0.3"
        strokeLinecap="round"
      />
      {/* Handle */}
      <path
        d="M48 20C54 20 56 28 56 34C56 40 54 46 48 46"
        stroke="#F9A825"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
    </svg>
  );
}

export function VapeIcon({ size = 64 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Vapor cloud */}
      <ellipse cx="32" cy="8" rx="10" ry="4" fill="#B0BEC5" opacity="0.4" />
      <ellipse cx="28" cy="6" rx="6" ry="3" fill="#CFD8DC" opacity="0.3" />
      <ellipse cx="36" cy="5" rx="7" ry="3" fill="#CFD8DC" opacity="0.3" />
      {/* Device body */}
      <rect x="26" y="14" width="12" height="40" rx="6" fill="#546E7A" />
      {/* Mouthpiece */}
      <rect x="28" y="12" width="8" height="8" rx="4" fill="#37474F" />
      {/* Button */}
      <circle cx="32" cy="34" r="3" fill="#78909C" />
      <circle cx="32" cy="34" r="1.5" fill="#4FC3F7" opacity="0.8" />
      {/* LED indicator */}
      <circle cx="32" cy="50" r="2" fill="#4FC3F7" opacity="0.6" />
      {/* Body highlight */}
      <rect x="28" y="18" width="2" height="30" rx="1" fill="white" opacity="0.15" />
    </svg>
  );
}

export function PotIcon({ size = 64 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main leaf */}
      <path
        d="M32 58V28"
        stroke="#388E3C"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Center leaflet */}
      <path
        d="M32 8C28 16 28 24 32 28C36 24 36 16 32 8Z"
        fill="#4CAF50"
      />
      {/* Left leaflets */}
      <path
        d="M18 16C20 22 26 26 32 28C28 22 22 16 18 16Z"
        fill="#4CAF50"
      />
      <path
        d="M10 26C16 28 24 28 32 28C24 24 16 22 10 26Z"
        fill="#66BB6A"
      />
      {/* Right leaflets */}
      <path
        d="M46 16C44 22 38 26 32 28C36 22 42 16 46 16Z"
        fill="#4CAF50"
      />
      <path
        d="M54 26C48 28 40 28 32 28C40 24 48 22 54 26Z"
        fill="#66BB6A"
      />
      {/* Leaf veins */}
      <path d="M32 28L26 18" stroke="#388E3C" strokeWidth="0.8" opacity="0.5" />
      <path d="M32 28L38 18" stroke="#388E3C" strokeWidth="0.8" opacity="0.5" />
      <path d="M32 28L18 24" stroke="#388E3C" strokeWidth="0.8" opacity="0.5" />
      <path d="M32 28L46 24" stroke="#388E3C" strokeWidth="0.8" opacity="0.5" />
    </svg>
  );
}

export const HABIT_ICONS: Record<string, React.FC<{ size?: number }>> = {
  espresso: EspressoIcon,
  beer: BeerIcon,
  vape: VapeIcon,
  pot: PotIcon,
};
