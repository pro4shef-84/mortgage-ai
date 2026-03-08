interface ProgressBarProps {
  completed: number
  total: number
}

export function ProgressBar({ completed, total }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-700">
          {completed} of {total} documents submitted
        </span>
        <span className="text-sm font-bold text-amber-600">{pct}%</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-3">
        <div
          className="bg-amber-500 h-3 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
}
