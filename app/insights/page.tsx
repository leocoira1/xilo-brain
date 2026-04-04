"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts"
import { BarChart3, DollarSign, TrendingUp, Download } from "lucide-react"
import AppShell from "@/components/app/AppShell"
import { BRAND } from "@/components/app/app-config"
import {
  KpiCard,
  SectionCard,
  SummaryRow,
  LegendItem,
  StatusBadge,
} from "@/components/app/ui"

const savingsTrend = [
  { month: "Jan", value: 18000 },
  { month: "Feb", value: 32000 },
  { month: "Mar", value: 54000 },
  { month: "Apr", value: 73000 },
  { month: "May", value: 91000 },
  { month: "Jun", value: 112000 },
  { month: "Jul", value: 128560 },
]

const insightRows = [
  {
    category: "Duplicate CPT",
    cases: "18",
    savings: "$24,600",
    status: "Confirmed Savings",
  },
  {
    category: "OON Mismatch",
    cases: "12",
    savings: "$18,200",
    status: "Pending Confirmation",
  },
  {
    category: "MUE Exceedance",
    cases: "9",
    savings: "$14,820",
    status: "Under Review",
  },
  {
    category: "AI Flagged Anomaly",
    cases: "6",
    savings: "$7,980",
    status: "New / AI Flagged",
  },
]

export default function InsightsPage() {
  return (
    <AppShell title="Insights">
      <div className="space-y-4">
        <div className="flex justify-end">
          <button className="flex items-center gap-2 rounded-xl border border-[#E5EAF5] bg-white px-4 py-2 text-sm font-semibold text-[#132447] shadow-sm hover:bg-[#F8FAFF]">
            <Download className="h-4 w-4" />
            Export Report
          </button>
        </div>

        <section className="grid grid-cols-3 gap-4">
          <KpiCard
            title="Total Savings"
            value="$128,560"
            subPrimary="+12.5%"
            subRest="vs last month"
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
            title="Flagged Cases"
            value="45"
            subPrimary="+6"
            subRest="new this month"
            icon={
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: BRAND.blueTint }}
              >
                <BarChart3
                  className="h-8 w-8"
                  style={{ color: BRAND.blue }}
                  strokeWidth={2.1}
                />
              </div>
            }
          />

          <KpiCard
            title="Savings Growth"
            value="18.4%"
            subPrimary="Q/Q"
            subRest="improvement"
            icon={
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: BRAND.greenTint }}
              >
                <TrendingUp
                  className="h-8 w-8"
                  style={{ color: BRAND.green }}
                  strokeWidth={2.1}
                />
              </div>
            }
          />
        </section>

        <section className="grid grid-cols-[1.55fr_1fr] gap-4">
          <div className="space-y-4">
            <SectionCard>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[24px] font-semibold text-[#132447]">
                  Savings Trend
                </h2>

                <div className="flex items-center gap-2">
                  <button className="rounded-lg bg-[#F3F6FC] px-3 py-1.5 text-sm font-medium text-[#132447] hover:bg-[#E8EDF7]">
                    30D
                  </button>
                  <button className="rounded-lg border border-[#E5EAF5] bg-white px-3 py-1.5 text-sm font-medium text-[#132447] hover:bg-[#F8FAFF]">
                    90D
                  </button>
                  <button className="rounded-lg border border-[#E5EAF5] bg-white px-3 py-1.5 text-sm font-medium text-[#132447] hover:bg-[#F8FAFF]">
                    YTD
                  </button>
                </div>
              </div>

              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={savingsTrend}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="insightsFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={BRAND.blue} stopOpacity={0.55} />
                        <stop offset="95%" stopColor={BRAND.blue} stopOpacity={0.08} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      vertical={false}
                      stroke="#DCE4F2"
                      strokeDasharray="4 6"
                    />

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
                        boxShadow: "0 10px 24px rgba(10,20,40,0.18)",
                      }}
                      formatter={(value: number) => [
                        `$${value.toLocaleString()}`,
                        "Savings",
                      ]}
                    />

                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={BRAND.blue}
                      strokeWidth={3}
                      fill="url(#insightsFill)"
                      activeDot={{
                        r: 6,
                        fill: "#fff",
                        stroke: BRAND.blue,
                        strokeWidth: 2,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard className="py-4">
              <div className="mb-4 flex items-center gap-2">
                <h3 className="text-[22px] font-semibold text-[#132447]">
                  Savings Mix
                </h3>
                <span
                  className="text-[28px] font-semibold leading-none"
                  style={{ color: BRAND.teal }}
                >
                  ↗
                </span>
              </div>

              <div className="mb-4 h-5 overflow-hidden rounded-full bg-[#DDE2EE]">
                <div className="flex h-full w-full">
                  <div className="h-full w-[58%]" style={{ backgroundColor: BRAND.teal }} />
                  <div className="h-full w-[24%]" style={{ backgroundColor: BRAND.yellow }} />
                  <div className="h-full w-[18%]" style={{ backgroundColor: BRAND.gray }} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-8 text-[16px] text-[#3B4660]">
                <LegendItem color={BRAND.teal} label="Confirmed 58%" />
                <LegendItem color={BRAND.yellow} label="Pipeline 24%" />
                <LegendItem color={BRAND.gray} label="New 18%" />
              </div>
            </SectionCard>
          </div>

          <SectionCard>
            <div className="flex h-full min-h-[410px] flex-col">
              <div>
                <h2 className="mb-6 text-[24px] font-semibold text-[#132447]">
                  Insight Summary
                </h2>

                <SummaryRow
                  label="Total Cases"
                  value="45"
                  valueClass="text-[#132447]"
                />
                <SummaryRow
                  label="Realized Savings"
                  value="$74,120"
                  valueClass="text-[#166D7E]"
                />
                <SummaryRow
                  label="Pipeline Value"
                  value="$54,440"
                  valueClass="text-[#1E98A4]"
                />
                <SummaryRow
                  label="Employee Confirmations"
                  value="$18,240"
                  valueClass="text-[#1E98A4]"
                />
                <SummaryRow
                  label="Avg Case Value"
                  value="$2,857"
                  valueClass="text-[#132447]"
                  noBorder
                />
              </div>

              <div className="mt-auto pt-8">
                <h3 className="mb-4 text-[22px] font-semibold text-[#132447]">
                  Resolution Progress
                </h3>

                <div className="mb-4 h-6 overflow-hidden rounded-full bg-[#DDE2EE]">
                  <div className="flex h-full w-full">
                    <div className="h-full w-[58%]" style={{ backgroundColor: BRAND.teal }} />
                    <div className="h-full w-[27%]" style={{ backgroundColor: BRAND.yellow }} />
                    <div className="h-full w-[15%]" style={{ backgroundColor: BRAND.gray }} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-8 text-[16px] text-[#3B4660]">
                  <LegendItem color={BRAND.teal} label="Resolved 58%" />
                  <LegendItem color={BRAND.yellow} label="Pending 27%" />
                  <LegendItem color={BRAND.gray} label="New 15%" />
                </div>
              </div>
            </div>
          </SectionCard>
        </section>

        <SectionCard>
          <h2 className="mb-4 text-[24px] font-semibold text-[#132447]">
            Savings by Category
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-separate border-spacing-0">
              <thead>
                <tr className="bg-[#EEF1FA] text-left text-[15px] uppercase tracking-[0.02em] text-[#41506D]">
                  <th className="rounded-l-[8px] px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Cases</th>
                  <th className="px-6 py-4 font-medium">Savings</th>
                  <th className="rounded-r-[8px] px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>

              <tbody>
                {insightRows.map((row) => (
                  <tr
                    key={row.category}
                    className="text-[18px] text-[#1D2740] transition hover:bg-[#F7FBFF]"
                  >
                    <td className="border-b border-[#E8EDF7] px-6 py-5 font-semibold">
                      {row.category}
                    </td>
                    <td className="border-b border-[#E8EDF7] px-6 py-5">{row.cases}</td>
                    <td className="border-b border-[#E8EDF7] px-6 py-5 font-semibold">
                      {row.savings}
                    </td>
                    <td className="border-b border-[#E8EDF7] px-6 py-5">
                      <StatusBadge status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  )
}
