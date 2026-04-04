"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Building2, CircleDollarSign, ShieldCheck, UserRound } from "lucide-react"
import AppShell from "@/components/app/AppShell"
import { SectionCard, StatusBadge } from "@/components/app/ui"

const claimDetails: Record<
  string,
  {
    id: string
    provider: string
    issue: string
    confidence: string
    savings: string
    status: string
    employee: string
    aiSummary: string
    nextAction: string
    notes: string[]
  }
> = {
  "BL-19041": {
    id: "BL-19041",
    provider: "Nett Radiology Center",
    issue: "Duplicate CPT (99213)",
    confidence: "99%",
    savings: "$4,500",
    status: "Under Review",
    employee: "Employee review not requested",
    aiSummary:
      "XILO detected a likely duplicate CPT billing event for the same date of service. This appears to be a recoverable overcharge and should be reviewed before escalation.",
    nextAction: "Validate duplicate billing and move to dispute workflow.",
    notes: [
      "Potential duplicate CPT on same date of service.",
      "No employee confirmation required yet.",
      "High confidence and recoverable savings opportunity.",
    ],
  },
  "BL-19242": {
    id: "BL-19242",
    provider: "Summit Medical Labs",
    issue: "OON Provider Mismatch",
    confidence: "97%",
    savings: "$4,200",
    status: "Pending Confirmation",
    employee: "Awaiting employee confirmation",
    aiSummary:
      "This claim appears to reflect an out-of-network mismatch. Employee confirmation may strengthen the challenge and support dispute preparation.",
    nextAction: "Send employee confirmation reminder and hold for review.",
    notes: [
      "Pending employee truth-layer response.",
      "Potential plan mismatch detected.",
      "Savings may convert after confirmation.",
    ],
  },
  "BG16231": {
    id: "BG16231",
    provider: "Chimpe Diagnostics",
    issue: "MUE Exceedance (93000)",
    confidence: "89%",
    savings: "$3,120",
    status: "Confirmed Savings",
    employee: "Confirmed",
    aiSummary:
      "The number of billed units appears to exceed medically expected thresholds. This item has already been validated and converted into confirmed savings.",
    nextAction: "Keep in resolved state and include in reporting.",
    notes: [
      "Savings already confirmed.",
      "Include in employer reporting.",
      "No additional outreach required.",
    ],
  },
  "BL-20314": {
    id: "BL-20314",
    provider: "Metro Pathology",
    issue: "AI Flagged Anomaly",
    confidence: "84%",
    savings: "$1,980",
    status: "New / AI Flagged",
    employee: "No outreach sent",
    aiSummary:
      "This bill was surfaced by anomaly detection and has not yet been reviewed by the operations team.",
    nextAction: "Assign to analyst for first-pass review.",
    notes: [
      "AI surfaced pattern deviation.",
      "No workflow started yet.",
      "Requires manual validation.",
    ],
  },
}

export default function ClaimDetailPage() {
  const params = useParams()
  const rawId = params?.id
  const id = Array.isArray(rawId) ? rawId[0] : rawId || ""

  const claim =
    claimDetails[id] ||
    {
      id,
      provider: "Unknown Provider",
      issue: "Claim not found in demo dataset",
      confidence: "--",
      savings: "--",
      status: "New / AI Flagged",
      employee: "Unknown",
      aiSummary:
        "This claim ID does not exist in the demo dataset yet. You can replace this with live backend data later.",
      nextAction: "Connect live claim data source.",
      notes: ["Demo placeholder", "Awaiting real data connection"],
    }

  return (
    <AppShell title="Claim Detail">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Link
            href="/claims"
            className="inline-flex items-center gap-2 rounded-full border border-[#E5EAF5] bg-white px-4 py-2 text-sm font-medium text-[#132447] shadow-sm hover:bg-[#F8FAFF]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Claims
          </Link>
        </div>

        <SectionCard>
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-sm text-[#6B7A99]">Bill ID</div>
              <div className="mt-1 text-3xl font-semibold text-[#132447]">{claim.id}</div>
              <div className="mt-3">
                <StatusBadge status={claim.status} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <MetricBlock
                icon={<Building2 className="h-4 w-4" />}
                label="Provider"
                value={claim.provider}
              />
              <MetricBlock
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Confidence"
                value={claim.confidence}
              />
              <MetricBlock
                icon={<CircleDollarSign className="h-4 w-4" />}
                label="Potential Savings"
                value={claim.savings}
              />
              <MetricBlock
                icon={<UserRound className="h-4 w-4" />}
                label="Employee Status"
                value={claim.employee}
              />
            </div>
          </div>
        </SectionCard>

        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
          <SectionCard>
            <h2 className="mb-4 text-xl font-semibold text-[#132447]">Issue Detected</h2>
            <p className="mb-5 text-lg font-medium text-[#132447]">{claim.issue}</p>

            <h3 className="mb-3 text-base font-semibold text-[#132447]">AI Summary</h3>
            <p className="leading-7 text-[#47536B]">{claim.aiSummary}</p>
          </SectionCard>

          <SectionCard>
            <h2 className="mb-4 text-xl font-semibold text-[#132447]">Next Action</h2>
            <p className="mb-5 leading-7 text-[#47536B]">{claim.nextAction}</p>

            <div className="space-y-3">
              <button className="w-full rounded-xl bg-[#1E73F0] px-4 py-3 text-sm font-semibold text-white hover:opacity-95">
                Open Workflow
              </button>
              <button className="w-full rounded-xl border border-[#E5EAF5] bg-white px-4 py-3 text-sm font-semibold text-[#132447] hover:bg-[#F8FAFF]">
                Mark Reviewed
              </button>
            </div>
          </SectionCard>
        </div>

        <SectionCard>
          <h2 className="mb-4 text-xl font-semibold text-[#132447]">Notes</h2>
          <ul className="space-y-3 text-[#47536B]">
            {claim.notes.map((note, index) => (
              <li key={index} className="rounded-xl bg-[#F8FAFF] px-4 py-3">
                {note}
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </AppShell>
  )
}

function MetricBlock({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-[#E5EAF5] bg-[#FAFCFF] p-4">
      <div className="mb-2 flex items-center gap-2 text-sm text-[#6B7A99]">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-base font-semibold text-[#132447]">{value}</div>
    </div>
  )
}
