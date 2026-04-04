"use client"

import {
  Bell,
  BarChart3,
  ClipboardList,
  DollarSign,
  Search,
  Settings,
  Users,
  Check,
  FileSearch,
  Sparkles,
} from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts"

const BRAND = {
  navy: "#03245A",
  navy2: "#062A67",
  teal: "#25B3A8",
  tealSoft: "#AEE6DF",
  tealTint: "#D9F4F0",
  blue: "#2E83F6",
  blueTint: "#DCEBFF",
  green: "#45C9B3",
  greenTint: "#D8F4EC",
  yellow: "#F1CC6A",
  yellowText: "#3A2F0E",
  gray: "#D7DDEA",
  grayText: "#25324A",
  border: "#E5EAF5",
  text: "#132447",
  muted: "#3E4861",
}

const chartData = [
  { month: "Jan", value: 12000 },
  { month: "Feb", value: 36000 },
  { month: "Mar", value: 58000 },
  { month: "Apr", value: 79000 },
  { month: "May", value: 98000 },
  { month: "Jun", value: 122000 },
  { month: "Jul", value: 149000 },
]

const bills = [
  {
    id: "BL 19041",
    provider: "Nett Radiology Center",
    issue: "Duplicate CPT (99213)",
    confidence: "99%",
    savings: "$4,500",
    status: "Under Review",
  },
  {
    id: "BL 19242",
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
    id: "BL 20314",
    provider: "Metro Pathology",
    issue: "AI Flagged Anomaly",
    confidence: "84%",
    savings: "$1,980",
    status: "New / AI Flagged",
  },
  {
    id: "BL 20780",
    provider: "Harbor Imaging",
    issue: "Modifier 25 Validation",
    confidence: "92%",
    savings: "$2,640",
    status: "Under Review",
  },
  {
    id: "BL 21106",
    provider: "Valley Cardiology",
    issue: "NCCI Bundling Conflict",
    confidence: "95%",
    savings: "$3,980",
    status: "Pending Confirmation",
  },
  {
    id: "BL 21458",
    provider: "Sunrise Labs",
    issue: "Duplicate CPT (93000)",
    confidence: "98%",
    savings: "$1,760",
    status: "Confirmed Savings",
  },
  {
    id: "BL 21991",
    provider: "Coastal Diagnostics",
    issue: "AI Flagged Unit Variance",
    confidence: "82%",
    savings: "$1,220",
    status: "New / AI Flagged",
  },
]

const navItems = [
  { label: "Dashboard", icon: BarChart3, active: true },
  { label: "Claims", icon: ClipboardList, active: false },
  { label: "Employees", icon: Users, active: false },
  { label: "Insights", icon: BarChart3, active: false },
  { label: "Settings", icon: Settings, active: false },
]

function statusClass(status: string) {
  switch (status) {
    case "Under Review":
      return "bg-[#1E73F0] text-white"
    case "Pending Confirmation":
      return "bg-[#F1CC6A] text-[#3A2F0E]"
    case "Confirmed Savings":
      return "bg-[#25B3A8] text-white"
    case "New / AI Flagged":
      return "bg-[#D7DDEA] text-[#25324A]"
    default:
      return "bg-[#D7DDEA] text-[#25324A]"
  }
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#EEF2FB] text-[#132447]">
      <div className="mx-auto min-h-screen max-w-[1600px] p-3">
        <div className="overflow-hidden rounded-[22px] border border-[#D9E0EF] bg-white shadow-[0_10px_40px_rgba(20,30,60,0.08)]">
          <div className="flex min-h-[100vh]">
            <aside className="w-[250px] shrink-0 bg-[linear-gradient(180deg,#03245A_0%,#062A67_60%,#03245A_100%)] px-5 py-6 text-white">
              <div className="mb-10">
                {/* Replace this block later with your SVG logo */}
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0">
                    <div className="absolute left-[10px] top-[7px] h-[2px] w-[42px] rotate-[39deg] rounded-full bg-white" />
                    <div className="absolute left-[10px] top-[42px] h-[2px] w-[42px] -rotate-[39deg] rounded-full bg-white" />
                    <div className="absolute left-[4px] top-[24px] h-[2px] w-[30px] rotate-[39deg] rounded-full bg-white" />
                    <div className="absolute right-[4px] top-[24px] h-[2px] w-[30px] -rotate-[39deg] rounded-full bg-white" />
                    <div
                      className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full"
                      style={{ backgroundColor: BRAND.teal }}
                    />
                  </div>
                  <div>
                    <div className="text-[46px] font-light leading-none tracking-[-0.06em]">
                      XILO
                    </div>
                    <div className="mt-1 text-[14px] tracking-[0.22em] text-white/90">
                      HEALTH
                    </div>
                  </div>
                </div>
              </div>

              <nav className="space-y-3">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.label}
                      className={`relative flex w-full items-center gap-4 rounded-[12px] px-5 py-4 text-left text-[17px] transition ${
                        item.active
                          ? "bg-[#1177F3] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                          : "text-white hover:bg-white/8"
                      }`}
                    >
                      {item.active ? (
                        <span
                          className="absolute inset-y-0 left-0 w-[4px] rounded-r-full"
                          style={{ backgroundColor: BRAND.teal }}
                        />
                      ) : null}
                      <Icon className="h-6 w-6" strokeWidth={1.9} />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </nav>

              <div className="mt-10 border-t border-white/20 pt-10">
                <button className="flex w-full items-center justify-center gap-3 rounded-[14px] bg-white px-5 py-4 text-[17px] font-semibold text-[#08356E] shadow-sm">
                  <Sparkles className="h-5 w-5" />
                  Run AI Scan
                </button>
                <div className="mt-8 border-t border-white/20 pt-6 text-[15px] text-white/90">
                  © 2024 XILO Health
                </div>
              </div>
            </aside>

            <main className="flex min-w-0 flex-1 flex-col bg-[#F9FBFF]">
              <header className="flex items-center justify-between border-b border-[#E3E9F4] bg-white px-8 py-4">
                <div className="flex items-center gap-8">
                  <h1 className="text-[28px] font-semibold text-[#132447]">
                    Dashboard
                  </h1>

                  <div className="relative w-[560px] max-w-[42vw]">
                    <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6D7990]" />
                    <input
                      className="h-14 w-full rounded-full border border-[#E6EAF3] bg-[#F1F3FA] pl-14 pr-5 text-[16px] outline-none placeholder:text-[#6E7890]"
                      placeholder="Search claim, or bill ID..."
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-[18px] text-[#33415C]">
                    Updated 2m ago <span className="mx-1 text-[#2BC38E]">●</span>
                    <span className="font-semibold text-[#132447]">Live</span>
                  </div>
                  <Bell className="h-7 w-7 text-[#132447]" strokeWidth={1.8} />
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&auto=format&fit=crop"
                    alt="User"
                    className="h-14 w-14 rounded-full object-cover"
                  />
                </div>
              </header>

              <div className="flex-1 overflow-y-auto px-8 py-8">
                <div className="space-y-4">
                  <section className="grid grid-cols-3 gap-4">
                    <KpiCard
                      title="Potential Savings"
                      value="$128,560"
                      subPrimary="12.5%"
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
                      title="Claims Requiring Review"
                      value="12"
                      subPrimary="+3 new"
                      subRest=""
                      icon={
                        <div
                          className="flex h-16 w-16 items-center justify-center rounded-full"
                          style={{ backgroundColor: BRAND.blueTint }}
                        >
                          <FileSearch
                            className="h-8 w-8"
                            style={{ color: BRAND.blue }}
                            strokeWidth={2.1}
                          />
                        </div>
                      }
                    />

                    <KpiCard
                      title="Claims Reviewed"
                      value="1,304"
                      subPrimary="87%"
                      subRest="confirmed accurate"
                      icon={
                        <div
                          className="flex h-16 w-16 items-center justify-center rounded-full"
                          style={{ backgroundColor: BRAND.greenTint }}
                        >
                          <Check
                            className="h-9 w-9"
                            style={{ color: BRAND.green }}
                            strokeWidth={2.4}
                          />
                        </div>
                      }
                    />
                  </section>

                  <section className="grid grid-cols-[1.55fr_1fr] gap-4">
                    <div className="space-y-4">
                      <div className="rounded-[20px] border border-[#E5EAF5] bg-white p-6 shadow-[0_4px_16px_rgba(20,30,60,0.04)]">
                        <h2 className="mb-4 text-[24px] font-semibold">Savings Over Time</h2>

                        <div className="h-[250px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={chartData}
                              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                            >
                              <defs>
                                <linearGradient id="savingsFill" x1="0" y1="0" x2="0" y2="1">
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
                                fill="url(#savingsFill)"
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
                      </div>

                      <div className="rounded-[20px] border border-[#E5EAF5] bg-white px-6 py-4 shadow-[0_4px_16px_rgba(20,30,60,0.04)]">
                        <div className="mb-4 flex items-center gap-2">
                          <h3 className="text-[22px] font-semibold">Employee Participation</h3>
                          <span
                            className="text-[28px] font-semibold leading-none"
                            style={{ color: BRAND.teal }}
                          >
                            ↗
                          </span>
                        </div>

                        <div className="mb-4 h-5 overflow-hidden rounded-full bg-[#DDE2EE]">
                          <div className="h-full w-[76%]" style={{ backgroundColor: BRAND.teal }} />
                        </div>

                        <div className="flex flex-wrap items-center gap-8 text-[16px] text-[#3B4660]">
                          <LegendItem color={BRAND.teal} label="Participating 76%" />
                          <LegendItem color={BRAND.gray} label="Not participating 24%" />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[20px] border border-[#E5EAF5] bg-white px-6 py-6 shadow-[0_4px_16px_rgba(20,30,60,0.04)]">
                      <div className="flex h-full min-h-[410px] flex-col">
                        <div>
                          <h2 className="mb-6 text-[24px] font-semibold">
                            Savings &amp; Resolution Summary
                          </h2>

                          <SummaryRow
                            label="Total Savings"
                            value="$128,560"
                            valueClass="text-[#132447]"
                          />
                          <SummaryRow
                            label="In Pipeline"
                            value="$82,300"
                            valueClass="text-[#166D7E]"
                          />
                          <SummaryRow
                            label="Confirmed Savings"
                            value="$44,120"
                            valueClass="text-[#1E98A4]"
                          />
                          <SummaryRow
                            label="Avg Resolution Time"
                            value="21 hrs"
                            valueClass="text-[#132447]"
                            noBorder
                          />
                        </div>

                        <div className="mt-auto pt-8">
                          <h3 className="mb-4 text-[22px] font-semibold">Savings Progress</h3>

                          <div className="mb-4 h-6 overflow-hidden rounded-full bg-[#DDE2EE]">
                            <div className="flex h-full w-full">
                              <div
                                className="h-full w-[76%]"
                                style={{ backgroundColor: BRAND.teal }}
                              />
                              <div
                                className="h-full w-[16%]"
                                style={{ backgroundColor: BRAND.yellow }}
                              />
                              <div
                                className="h-full w-[8%]"
                                style={{ backgroundColor: BRAND.gray }}
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-8 text-[16px] text-[#3B4660]">
                            <LegendItem color={BRAND.teal} label="Resolved 76%" />
                            <LegendItem color={BRAND.yellow} label="Pending 16%" />
                            <LegendItem color={BRAND.gray} label="New 4%" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-[20px] border border-[#E5EAF5] bg-white p-6 shadow-[0_4px_16px_rgba(20,30,60,0.04)]">
                    <h2 className="mb-4 text-[24px] font-semibold">Flagged Bills</h2>

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
                          {bills.map((bill) => (
                            <tr key={`${bill.id}-${bill.status}`} className="text-[18px] text-[#1D2740]">
                              <td className="border-b border-[#E8EDF7] px-6 py-5 font-semibold">
                                {bill.id}
                              </td>
                              <td className="border-b border-[#E8EDF7] px-6 py-5">
                                {bill.provider}
                              </td>
                              <td className="border-b border-[#E8EDF7] px-6 py-5">{bill.issue}</td>
                              <td className="border-b border-[#E8EDF7] px-6 py-5 font-semibold">
                                {bill.confidence}
                              </td>
                              <td className="border-b border-[#E8EDF7] px-6 py-5 font-semibold">
                                {bill.savings}
                              </td>
                              <td className="border-b border-[#E8EDF7] px-6 py-5">
                                <span
                                  className={`inline-flex min-w-[210px] items-center justify-center rounded-[10px] px-5 py-3 text-[16px] font-medium ${statusClass(
                                    bill.status
                                  )}`}
                                >
                                  {bill.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  title,
  value,
  subPrimary,
  subRest,
  icon,
}: {
  title: string
  value: string
  subPrimary: string
  subRest: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-[20px] border border-[#E5EAF5] bg-white px-6 py-5 shadow-[0_4px_16px_rgba(20,30,60,0.04)]">
      <div className="flex items-start gap-5">
        {icon}
        <div className="min-w-0">
          <div className="mb-3 text-[22px] font-semibold">{title}</div>
          <div className="mb-3 text-[56px] font-semibold leading-none tracking-[-0.03em]">
            {value}
          </div>
          <div className="text-[16px]">
            <span className="font-semibold text-[#27BFB4]">{subPrimary}</span>
            {subRest ? <span className="ml-2 text-[#3E4861]">{subRest}</span> : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  valueClass,
  noBorder = false,
}: {
  label: string
  value: string
  valueClass?: string
  noBorder?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between py-4 ${
        noBorder ? "" : "border-b border-[#E4E9F3]"
      }`}
    >
      <span className="text-[22px] text-[#23314F]">{label}</span>
      <span className={`text-[28px] font-semibold ${valueClass || "text-[#132447]"}`}>
        {value}
      </span>
    </div>
  )
}

function LegendItem({
  color,
  label,
}: {
  color: string
  label: string
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-4 w-4 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  )
}
