type ChristmasScallopDividerProps = {
  /** Color of the scallops (top section edge) */
  from: string;
  /** Background below the divider */
  to: string;
};

export function ChristmasScallopDivider({ from, to }: ChristmasScallopDividerProps) {
  return (
    <div className="pointer-events-none relative -mt-px h-6 w-full overflow-hidden leading-[0]" aria-hidden>
      <svg
        viewBox="0 0 1200 24"
        preserveAspectRatio="none"
        className="h-full w-full"
      >
        <path
          d="M0,0 H1200 V24 Q1150,8 1100,24 T1000,24 T900,24 T800,24 T700,24 T600,24 T500,24 T400,24 T300,24 T200,24 T100,24 T0,24 Z"
          fill={to}
        />
        <path
          d="M0,0 H1200 V12 Q1150,0 1100,12 T1000,12 T900,12 T800,12 T700,12 T600,12 T500,12 T400,12 T300,12 T200,12 T100,12 T0,12 Z"
          fill={from}
          opacity="0.95"
        />
      </svg>
    </div>
  );
}
