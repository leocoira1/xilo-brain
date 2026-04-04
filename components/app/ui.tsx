import { BRAND } from "./app-config"

export function KpiCard({
  title,
  value,
  subPrimary,
  subRest,
  icon,
}: {
  title: string
  value: string
  subPrimary: string
  subRest?: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-[20px] border border-[#E5EAF5] bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm text-[#6B7A99]">{title}</div>
          <div className="mt-2 text-2xl font-semibold text-[#132447]">{value}</div>
          <div className="mt-2 text-sm">
            <span className="font-semibold text-[#25B3A8]">{subPrimary}</span>
            {subRest ? <span className="ml-1 text-[#6B7A99]">{subRest}</span> : null}
          </div>
        </div>
        <div className="shrink-0">{icon}</div>
      </div>
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string }> = {
    "Confirmed Savings": {
      bg: "#DFF6F3",
      text: "#25B3A8",
    },
    "Pending Confirmation": {
      bg: "#FFF4CC",
      text: "#9A6B00",
    },
    "Under Review": {
      bg: "#E8F1FF",
      text: "#1E73F0",
    },
    "New / AI Flagged": {
      bg: "#EEF1F6",
      text: "#55627A",
    },
  }

  const style = styles[status] || styles["New / AI Flagged"]

  return (
    <span
      className="inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-medium"
      style={{
        backgroundColor: style.bg,
        color: style.text,
      }}
    >
      {status}
    </span>
  )
}

export function SectionCard({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-[20px] border border-[#E5EAF5] bg-white p-6 shadow-sm ${className}`}
    >
      {children}
    </div>
  )
}
