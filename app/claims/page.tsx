"use client"

import { useRouter } from "next/navigation"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts"
import { ClipboardList, Clock3, DollarSign } from "lucide-react"
import AppShell from "@/components/app/AppShell"
import { BRAND } from "@/components/app/app-config"
import { KpiCard, StatusBadge } from "@/components/app/ui"

const claimsTrend = [
  { month: "Jan", open: 11 },
  { month: "Feb", open: 16 },
  { month: "Mar", open: 14 },
  { month: "Apr", open: 21 },
  { month: "May", open: 19 },
  { month: "Jun", open: 12 },
  { month: "Jul", open: 10 },
]

const claims = [
  {
    id: "BL-19041",
    provider: "Nett Radiology Center",
    issue: "Duplicate CPT (99213)",
    confidence: "99%",
    savings: "$4,500",
    status: "Under Review",
  },
  {
    id: "BL-19242",
    provider: "Summit Medical Labs",
    issue: "OON Provider Mismatch",
    confidence: "97%",
    savings: "$4,200",
    status: "Pending Confirmation",
  },
  {
    id: "BG16231",
    provider: "Chimpe Diagnostics",
    issue: "MUE Exceedance (93000)",
    confidence: "89%",
    savings: "$3,120",
    status: "Confirmed Savings",
  },
  {
    id: "BL-20314",
    provider: "Metro Pathology",
    issue: "AI Flagged Anomaly",
    confidence: "84%",
    savings: "$1,980",
    status: "New / AI Flagged",
  },
]

export default function ClaimsPage() {
  const router = useRouter()

  return (
    <AppShell title="Claims">
      <div className="space-y-4">
        <section className="grid grid-cols-3 gap-4">
          <KpiCard
            title="Open Claims"
            value="12"
            subPrimary="+3"
            subRest="new this week"
            icon={
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: BRAND.blueTint }}
              >
                <ClipboardList
                  className="h-8 w-8"
                  style={{ color: BRAND.blue }}
                  strokeWidth={2.1}
                />
              </div>
            }
          />
          <KpiCard
            title="Pipeline Savings"
            value="$82,300"
            subPrimary="16%"
            subRest="awaiting confirmation"
            icon={
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: BRAND.tealSoft }}
              >
                <DollarSign
                  className="h-8 w-8"
                  style={{ color: BRAND.teal }}
                  strokeWidth={2.1}
                />
              </div>
            }
          />
          <KpiCard
            title="Avg Resolution Time"
            value="21 hrs"
            subPrimary="94%"
            subRest="< 48 hr SLA"
            icon={
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: BRAND.greenTint }}
              >
                <Clock3
                  className="h-8 w-8"
                  style={{ color: BRAND.green }}
                  strokeWidth={2.1}
                />
              </div>
            }
          />
        </section>

        <section className="grid grid-cols-[1.25fr_1fr] gap-4">
          <div className="rounded-[20px] border border-[#E5EAF5] bg-white p-6 shadow-[0_4px_16px_rgba(20,30,60,0.04)]">
            <h2 className="mb-4 text-[24px] font-semibold">Claims Trend</h2>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={claimsTrend}>
                  <defs>
                    <linearGradient id="claimsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={BRAND.blue} stopOpacity={0.45} />
                      <stop offset="95%" stopColor={BRAND.blue} stopOpacity={0.08} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#DCE4F2" strokeDasharray="4 6" />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#42506D", fontSize: 16 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#102A58",
                      border: "none",
                      borderRadius: "14px",
                      color: "#fff",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="open"
                    stroke={BRAND.blue}
                    strokeWidth={3}
                    fill="url(#claimsFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-[20px] border border-[#E5EAF5] bg-white p-6 shadow-[0_4px_16px_rgba(20,30,60,0.04)]">
            <h2 className="mb-5 text-[24px] font-semibold">Claims Pipeline</h2>

            <div className="space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between text-[18px]">
                  <span>Under Review</span>
                  <span className="font-semibold">5 claims</span>
                </div>
                <div className="h-4 rounded-full bg-[#E6ECF5]">
                  <div className="h-4 w-[42%] rounded-full bg-[#1E73F0]" />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-[18px]">
                  <span>Pending Confirmation</span>
                  <span className="font-semibold">4 claims</span>
                </div>
                <div className="h-4 rounded-full bg-[#E6ECF5]">
                  <div className="h-4 w-[33%] rounded-full bg-[#F1CC6A]" />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-[18px]">
                  <span>Confirmed Savings</span>
                  <span className="font-semibold">2 claims</span>
                </div>
                <div className="h-4 rounded-full bg-[#E6ECF5]">
                  <div className="h-4 w-[18%] rounded-full bg-[#25B3A8]" />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-[18px]">
                  <span>New / AI Flagged</span>
                  <span className="font-semibold">1 claim</span>
                </div>
                <div className="h-4 rounded-full bg-[#E6ECF5]">
                  <div className="h-4 w-[8%] rounded-full bg-[#D7DDEA]" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[20px] border border-[#E5EAF5] bg-white p-6 shadow-[0_4px_16px_rgba(20,30,60,0.04)]">
          <h2 className="mb-4 text-[24px] font-semibold">Claims Queue</h2>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-separate border-spacing-0">
              <thead>
                <tr className="bg-[#EEF1FA] text-left text-[15px] uppercase tracking-[0.02em] text-[#41506D]">
                  <th className="rounded-l-[8px] px-6 py-4 font-medium">Bill ID</th>
                  <th className="px-6 py-4 font-medium">Provider</th>
                  <th className="px-6 py-4 font-medium">Issue Detected</th>
                  <th className="px-6 py-4 font-medium">Confidence</th>
                  <th className="px-6 py-4 font-medium">Savings</th>
                  <th className="rounded-r-[8px] px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>

              <tbody>
                {claims.map((claim) => (
                  <tr
                    key={claim.id}
                    onClick={() => router.push(`/claims/${claim.id}`)}
                    className="cursor-pointer text-[18px] text-[#1D2740] transition hover:bg-[#F7FBFF]"
                  >
                    <td className="border-b border-[#E8EDF7] px-6 py-5 font-semibold">
                      {claim.id}
                    </td>
                    <td className="border-b border-[#E8EDF7] px-6 py-5">
                      {claim.provider}
                    </td>
                    <td className="border-b border-[#E8EDF7] px-6 py-5">
                      {claim.issue}
                    </td>
                    <td className="border-b border-[#E8EDF7] px-6 py-5 font-semibold">
                      {claim.confidence}
                    </td>
                    <td className="border-b border-[#E8EDF7] px-6 py-5 font-semibold">
                      {claim.savings}
                    </td>
                    <td className="border-b border-[#E8EDF7] px-6 py-5">
                      <div onClick={(e) => e.stopPropagation()}>
                        <StatusBadge status={claim.status} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
