import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/src/lib/utils'

type AlertVariant = 'info' | 'success' | 'warning' | 'error'

interface AlertProps {
  variant?: AlertVariant
  title?: string
  children: React.ReactNode
  className?: string
  onDismiss?: () => void
}

const config: Record<AlertVariant, { icon: React.ReactNode; classes: string }> = {
  info: {
    icon: <Info className="w-5 h-5 text-blue-600" />,
    classes: 'bg-blue-50 border-blue-200 text-blue-900',
  },
  success: {
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
    classes: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
    classes: 'bg-amber-50 border-amber-200 text-amber-900',
  },
  error: {
    icon: <AlertCircle className="w-5 h-5 text-red-600" />,
    classes: 'bg-red-50 border-red-200 text-red-900',
  },
}

export function Alert({ variant = 'info', title, children, className, onDismiss }: AlertProps) {
  const { icon, classes } = config[variant]

  return (
    <div
      role="alert"
      className={cn(
        'flex gap-3 items-start p-4 rounded-lg border',
        classes,
        className
      )}
    >
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold mb-1">{title}</p>}
        <div className="text-sm">{children}</div>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="flex-shrink-0 ml-auto">
          <X className="w-4 h-4 opacity-60 hover:opacity-100" />
        </button>
      )}
    </div>
  )
}
