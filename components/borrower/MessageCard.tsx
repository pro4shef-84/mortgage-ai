import { Info, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface MessageCardProps {
  type?: 'info' | 'warning' | 'success'
  title?: string
  message: string
}

const config = {
  info: { icon: <Info className="w-5 h-5 text-blue-500 mt-0.5" />, bg: 'bg-blue-50 border-blue-200', text: 'text-blue-900' },
  warning: { icon: <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />, bg: 'bg-amber-50 border-amber-200', text: 'text-amber-900' },
  success: { icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />, bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-900' },
}

export function MessageCard({ type = 'info', title, message }: MessageCardProps) {
  const { icon, bg, text } = config[type]

  return (
    <div className={`flex gap-3 items-start p-4 rounded-xl border ${bg}`}>
      {icon}
      <div>
        {title && <p className={`font-semibold ${text} mb-1`}>{title}</p>}
        <p className={`text-sm ${text}`}>{message}</p>
      </div>
    </div>
  )
}
