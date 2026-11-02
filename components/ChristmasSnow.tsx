"use client";

const FLAKE_COUNT = 20;

const SNOWFLAKE_PATHS = [
  "M12 2v20M12 2l2.5 4.5M12 2l-2.5 4.5M12 22l2.5-4.5M12 22l-2.5-4.5M2 12h20M2 12l4.5 2.5M2 12l4.5-2.5M22 12l-4.5 2.5M22 12l-4.5-2.5M5 5l14 14M5 19L19 5",
  "M12 1v22M12 1l3 5M12 1L9 6M12 23l3-5M12 23l-3-5M1 12h22M1 12l5 3M1 12l5-3M23 12l-5 3M23 12l-5-3M4 4l16 16M4 20L20 4M12 6v12M6 12h12",
  "M12 2v8M8 6h8M12 14v8M8 18h8M2 12h8M6 8v8M14 12h8M18 8v8M5 5l4 4M19 5l-4 4M5 19l4-4M19 19l-4-4",
] as const;

function flakeStyle(i: number): React.CSSProperties {
  const left = (i * 13 + 5) % 98;
  const big = i % 7 === 0 || i % 11 === 0;
  const size = big ? 26 + (i % 3) * 4 : 14 + (i % 5);
  const duration = 10 + (i % 8);
  const delay = -((i * 0.65) % 14);
  const drift = (i % 2 === 0 ? 1 : -1) * (18 + (i % 5) * 8);
  const sway = (i % 3) * 0.4 + 0.8;
  const staticTop = `${((i * 17 + 5) % 85) + 5}%`;
  return {
    left: `${left}%`,
    width: size,
    height: size,
    animationDuration: `${duration}s, ${sway}s`,
    animationDelay: `${delay}s, ${delay * 0.3}s`,
    ["--snow-drift" as string]: `${drift}px`,
    ["--snow-sway" as string]: `${drift * 0.35}px`,
    ["--snow-static-top" as string]: staticTop,
  };
}

function SnowflakeSvg({ variant }: { variant: number }) {
  const d = SNOWFLAKE_PATHS[variant % SNOWFLAKE_PATHS.length];
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" aria-hidden>
      <path
        d={d}
        fill="white"
        stroke="white"
        strokeWidth="0.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: "drop-shadow(0 1px 2px rgba(50, 51, 53, 0.45)) drop-shadow(0 0 1px rgba(170, 29, 80, 0.25))" }}
      />
    </svg>
  );
}

export function ChristmasSnow() {
  return (
    <>
      <style>{`
        @keyframes christmas-snow-fall {
          0% {
            transform: translateY(-8%) translateX(0);
          }
          100% {
            transform: translateY(110%) translateX(var(--snow-drift, 0px));
          }
        }
        @keyframes christmas-snow-sway {
          0%, 100% {
            margin-left: 0;
          }
          50% {
            margin-left: var(--snow-sway, 8px);
          }
        }
        .christmas-snow-flake {
          position: absolute;
          top: 0;
          animation: christmas-snow-fall linear infinite, christmas-snow-sway ease-in-out infinite;
          line-height: 0;
          user-select: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .christmas-snow-flake {
            animation: none;
            top: var(--snow-static-top, 20%);
          }
        }
      `}</style>
      <div
        className="christmas-snow-layer pointer-events-none absolute inset-0 z-0 overflow-hidden"
        aria-hidden
      >
        {Array.from({ length: FLAKE_COUNT }, (_, i) => (
          <span key={i} className="christmas-snow-flake text-white" style={flakeStyle(i)}>
            <SnowflakeSvg variant={i % SNOWFLAKE_PATHS.length} />
          </span>
        ))}
      </div>
    </>
  );
}
