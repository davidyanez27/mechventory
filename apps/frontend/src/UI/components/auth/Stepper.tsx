// Step dots + connector lines for the register wizard. Purely presentational.
export const STEPS = ['Email', 'Details', 'Password'] as const;

export const Stepper = ({ current }: { current: number }) => (
  <div className="mt-1 mb-7 flex items-center">
    {STEPS.map((label, i) => {
      const state = i < current ? 'done' : i === current ? 'active' : 'upcoming';
      const isLast = i === STEPS.length - 1;
      return (
        <Step key={label} label={label} index={i} state={state} isLast={isLast} filled={i < current} />
      );
    })}
  </div>
);

const Step = ({
  label,
  index,
  state,
  isLast,
  filled,
}: {
  label: string;
  index: number;
  state: 'done' | 'active' | 'upcoming';
  isLast: boolean;
  filled: boolean;
}) => {
  const dot =
    'flex h-[26px] w-[26px] items-center justify-center rounded-full border font-mv-mono text-[12px] font-medium transition-all';
  const dotState = {
    upcoming: 'border-mv-line-2 bg-transparent text-mv-muted',
    active:
      'border-white bg-white text-black shadow-[0_0_0_4px_rgba(255,255,255,0.08)]',
    done: 'border-[#2e2e2e] bg-[#2e2e2e] text-mv-fg',
  }[state];

  const slabelState = {
    upcoming: 'text-mv-muted-2',
    active: 'text-mv-fg',
    done: 'text-mv-muted',
  }[state];

  return (
    <>
      <div className="flex flex-shrink-0 flex-col items-center gap-2">
        <div className={`${dot} ${dotState}`}>
          {state === 'done' ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M5 12.5l4.5 4.5L19 6.5"
                stroke="#ededed"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            index + 1
          )}
        </div>
        <div className={`text-[11px] tracking-[0.04em] transition-colors max-[520px]:hidden ${slabelState}`}>
          {label}
        </div>
      </div>
      {!isLast && (
        <div
          className={`relative top-[-12px] mx-2 h-px flex-1 transition-colors ${
            filled ? 'bg-mv-muted-2' : 'bg-mv-line-2'
          }`}
        />
      )}
    </>
  );
};
