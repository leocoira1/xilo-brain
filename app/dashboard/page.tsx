"use client"

import { useMemo, useState, type ReactNode } from "react"
import { Check, DollarSign, FileSearch, Search, Sparkles } from "lucide-react"
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
  blue: "#2E83F6",
  blueTint: "#DCEBFF",
  green: "#45C9B3",
  greenTint: "#D8F4EC",
  yellow: "#F1CC6A",
  gray: "#D7DDEA",
}

type ScanSummary = {
  scanned_claims: number
  total_claims: number
  red_flags: number
  yellow_flags: number
  green: number
  shadow: number
  requires_truth_layer: number
  estimated_savings: number
  avg_resolution_time_hours?: number | null
  employee_participation_rate?: number | null
}

type FinalClassification = "red" | "yellow" | "green" | "shadow"

type ClassificationResult = {
  claim_id: string
  classification: {
    claim_id: string
    final_classification: FinalClassification
    final_confidence: number
    estimated_savings_total?: number | null
    requires_truth_layer?: boolean | null
    provider_name?: string | null
    issue_detected?: string | null
  }
}

type ScanResponse = {
  summary: ScanSummary
  results: ClassificationResult[]
}

type BillRow = {
  id: string
  provider: string
  issue: string
  confidence: string
  savings: string
  status: string
}

const navItems = [
  { label: "Dashboard", active: true },
  { label: "Claims", active: false },
  { label: "Employees", active: false },
  { label: "Insights", active: false },
  { label: "Settings", active: false },
]

function formatCurrency(value?: number | null) {
  if (value == null || Number.isNaN(value)) return "—"

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatInteger(value?: number | null) {
  if (value == null || Number.isNaN(value)) return "—"
  return value.toLocaleString()
}

function formatPercent(value?: number | null) {
  if (value == null || Number.isNaN(value)) return "—"
  return `${Math.round(value)}%`
}

function formatConfidence(value?: number | null) {
  if (value == null || Number.isNaN(value)) return "—"
  return `${Math.round(value * 100)}%`
}

function formatHours(value?: number | null) {
  if (value == null || Number.isNaN(value)) return "—"
  return `${Math.round(value)} hrs`
}

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

function mapClassificationToStatus(item: ClassificationResult): string {
  const c = item.classification

  if (c.final_classification === "green") return "Confirmed Savings"
  if (c.final_classification === "shadow") return "New / AI Flagged"
  if (c.final_classification === "yellow" && c.requires_truth_layer) {
    return "Pending Confirmation"
  }

  return "Under Review"
}

function getSavingsBreakdown(results: ClassificationResult[]) {
  return results.reduce(
    (acc, item) => {
      const amount = item.classification.estimated_savings_total || 0
      const classification = item.classification.final_classification

      if (classification === "green") {
        acc.confirmed += amount
      } else if (classification === "yellow" || classification === "red") {
        acc.pipeline += amount
      } else {
        acc.newAmount += amount
      }

      return acc
    },
    {
      confirmed: 0,
      pipeline: 0,
      newAmount: 0,
    }
  )
}

function buildChartDataFromResults(results: ClassificationResult[]) {
  const totals = results.reduce(
    (acc, item) => {
      const amount = item.classification.estimated_savings_total || 0
      const classification = item.classification.final_classification

      if (classification === "red") acc.flagged += amount
      if (classification === "yellow") acc.review += amount
      if (classification === "green") acc.confirmed += amount

      return acc
    },
    {
      flagged: 0,
      review: 0,
      confirmed: 0,
    }
  )

  return [
    { label: "Flagged", value: totals.flagged },
    { label: "Review", value: totals.flagged + totals.review },
    {
      label: "Confirmed",
      value: totals.flagged + totals.review + totals.confirmed,
    },
  ]
}

function buildBillsFromResults(results: ClassificationResult[]): BillRow[] {
  return results.map((item, index) => {
    const c = item.classification

    return {
      id: c.claim_id || item.claim_id || `CLM-${index + 1}`,
      provider: c.provider_name || "Unknown Provider",
      issue: c.issue_detected || `Classification: ${c.final_classification}`,
      confidence: formatConfidence(c.final_confidence),
      savings: formatCurrency(c.estimated_savings_total),
      status: mapClassificationToStatus(item),
    }
  })
}

export default function DashboardPage() {
  const [scanData, setScanData] = useState<ScanResponse | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const summary = scanData?.summary ?? null
  const results = scanData?.results ?? []

  const hasScanData = Boolean(scanData)
  const hasResults = results.length > 0

  const savingsBreakdown = useMemo(() => getSavingsBreakdown(results), [results])
  const bills = useMemo(() => buildBillsFromResults(results), [results])
  const chartData = useMemo(
    () => buildChartDataFromResults(results),
    [results]
  )

  const claimsRequiringReview = summary
    ? summary.red_flags + summary.yellow_flags
    : null

  const reviewedPercent =
    summary && summary.total_claims > 0
      ? Math.round((summary.scanned_claims / summary.total_claims) * 100)
      : null

  const resolvedCount = results.filter(
    (item) => item.classification.final_classification === "green"
  ).length

  const pendingCount = results.filter((item) => {
    const c = item.classification
    return c.final_classification === "red" || c.final_classification === "yellow"
  }).length

  const newCount = results.filter(
    (item) => item.classification.final_classification === "shadow"
  ).length

  const totalTracked = resolvedCount + pendingCount + newCount

  const resolvedPct =
    totalTracked > 0 ? Math.round((resolvedCount / totalTracked) * 100) : null
  const pendingPct =
    totalTracked > 0 ? Math.round((pendingCount / totalTracked) * 100) : null
  const newPct =
    totalTracked > 0 ? Math.round((newCount / totalTracked) * 100) : null

  const participationRate = summary?.employee_participation_rate ?? null
  const nonParticipationRate =
    participationRate != null ? Math.max(0, 100 - participationRate) : null

  async function handleRunScan() {
    try {
      setIsScanning(true)
      setError(null)

      const response = await fetch("/api/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Scan failed with status ${response.status}`)
      }

      const data: ScanResponse = await response.json()
      setScanData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to run scan.")
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#EEF2FB] text-[#132447]">
      <div className="mx-auto min-h-screen max-w-[1600px] p-3">
        <div className="overflow-hidden rounded-[22px] border border-[#D9E0EF] bg-white shadow-[0_10px_40px_rgba(20,30,60,0.08)]">
          <div className="flex min-h-[100vh]">
            <aside className="w-[250px] shrink-0 bg-[linear-gradient(180deg,#03245A_0%,#062A67_60%,#03245A_100%)] px-5 py-6 text-white">
              <div className="mb-10">
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
                {navItems.map((item) => (
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
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>

              <div className="mt-10 border-t border-white/20 pt-10">
                <button
                  onClick={handleRunScan}
                  disabled={isScanning}
                  className="flex w-full items-center justify-center gap-3 rounded-[14px] bg-white px-5 py-4 text-[17px] font-semibold text-[#08356E] shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Sparkles className="h-5 w-5" />
                  {isScanning ? "Running Scan..." : "Run AI Scan"}
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
                    {hasScanData ? (
                      <>
                        Updated just now <span className="mx-1 text-[#2BC38E]">●</span>
                        <span className="font-semibold text-[#132447]">Live</span>
                      </>
                    ) : (
                      <span className="text-[#6D7990]">No scan loaded</span>
                    )}
                  </div>

                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&auto=format&fit=crop"
                    alt="User"
                    className="h-14 w-14 rounded-full object-cover"
                  />
                </div>
              </header>

              <div className="flex-1 overflow-y-auto px-8 py-8">
                {error ? (
                  <div className="mb-4 rounded-[16px] border border-red-200 bg-red-50 px-5 py-4 text-[15px] text-red-700">
                    {error}
                  </div>
                ) : null}

                <div className="space-y-4">
                  <section className="grid grid-cols-3 gap-4">
                    <KpiCard
                      title="Potential Savings"
                      value={summary ? formatCurrency(summary.estimated_savings) : "—"}
                      subPrimary={summary ? "Live scan output" : "No scan data"}
                      subRest=""
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
                      value={formatInteger(claimsRequiringReview)}
                      subPrimary={
                        summary
                          ? `${formatInteger(summary.requires_truth_layer)} need truth layer`
                          : "No scan data"
                      }
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
                      value={summary ? formatInteger(summary.scanned_claims) : "—"}
                      subPrimary={
                        reviewedPercent != null
                          ? `${reviewedPercent}% of total claims`
                          : "No scan data"
                      }
                      subRest=""
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
                          {hasResults ? (
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
                                  dataKey="label"
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
                                    formatCurrency(value),
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
                          ) : (
                            <EmptyPanelMessage message="Run a scan to populate the savings chart." />
                          )}
                        </div>
                      </div>

                      <div className="rounded-[20px] border border-[#E5EAF5] bg-white px-6 py-4 shadow-[0_4px_16px_rgba(20,30,60,0.04)]">
                        <div className="mb-4 flex items-center gap-2">
                          <h3 className="text-[22px] font-semibold">Employee Participation</h3>
                          {participationRate != null ? (
                            <span
                              className="text-[28px] font-semibold leading-none"
                              style={{ color: BRAND.teal }}
                            >
                              ↗
                            </span>
                          ) : null}
                        </div>

                        {participationRate != null ? (
                          <>
                            <div className="mb-4 h-5 overflow-hidden rounded-full bg-[#DDE2EE]">
                              <div
                                className="h-full"
                                style={{
                                  width: `${participationRate}%`,
                                  backgroundColor: BRAND.teal,
                                }}
                              />
                            </div>

                            <div className="flex flex-wrap items-center gap-8 text-[16px] text-[#3B4660]">
                              <LegendItem
                                color={BRAND.teal}
                                label={`Participating ${formatPercent(participationRate)}`}
                              />
                              <LegendItem
                                color={BRAND.gray}
                                label={`Not participating ${formatPercent(nonParticipationRate)}`}
                              />
                            </div>
                          </>
                        ) : (
                          <EmptyPanelMessage message="Participation data is not available in the current scan payload." />
                        )}
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
                            value={summary ? formatCurrency(summary.estimated_savings) : "—"}
                            valueClass="text-[#132447]"
                          />
                          <SummaryRow
                            label="In Pipeline"
                            value={hasResults ? formatCurrency(savingsBreakdown.pipeline) : "—"}
                            valueClass="text-[#166D7E]"
                          />
                          <SummaryRow
                            label="Confirmed Savings"
                            value={hasResults ? formatCurrency(savingsBreakdown.confirmed) : "—"}
                            valueClass="text-[#1E98A4]"
                          />
                          <SummaryRow
                            label="Avg Resolution Time"
                            value={formatHours(summary?.avg_resolution_time_hours)}
                            valueClass="text-[#132447]"
                            noBorder
                          />
                        </div>

                        <div className="mt-auto pt-8">
                          <h3 className="mb-4 text-[22px] font-semibold">Savings Progress</h3>

                          {totalTracked > 0 &&
                          resolvedPct != null &&
                          pendingPct != null &&
                          newPct != null ? (
                            <>
                              <div className="mb-4 h-6 overflow-hidden rounded-full bg-[#DDE2EE]">
                                <div className="flex h-full w-full">
                                  <div
                                    className="h-full"
                                    style={{
                                      width: `${resolvedPct}%`,
                                      backgroundColor: BRAND.teal,
                                    }}
                                  />
                                  <div
                                    className="h-full"
                                    style={{
                                      width: `${pendingPct}%`,
                                      backgroundColor: BRAND.yellow,
                                    }}
                                  />
                                  <div
                                    className="h-full"
                                    style={{
                                      width: `${newPct}%`,
                                      backgroundColor: BRAND.gray,
                                    }}
                                  />
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-8 text-[16px] text-[#3B4660]">
                                <LegendItem
                                  color={BRAND.teal}
                                  label={`Resolved ${resolvedPct}%`}
                                />
                                <LegendItem
                                  color={BRAND.yellow}
                                  label={`Pending ${pendingPct}%`}
                                />
                                <LegendItem
                                  color={BRAND.gray}
                                  label={`New ${newPct}%`}
                                />
                              </div>
                            </>
                          ) : (
                            <EmptyPanelMessage message="Run a scan to calculate resolution progress." />
                          )}
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
                          {bills.length > 0 ? (
                            bills.map((bill) => (
                              <tr
                                key={`${bill.id}-${bill.status}`}
                                className="text-[18px] text-[#1D2740]"
                              >
                                <td className="border-b border-[#E8EDF7] px-6 py-5 font-semibold">
                                  {bill.id}
                                </td>
                                <td className="border-b border-[#E8EDF7] px-6 py-5">
                                  {bill.provider}
                                </td>
                                <td className="border-b border-[#E8EDF7] px-6 py-5">
                                  {bill.issue}
                                </td>
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
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={6}
                                className="px-6 py-10 text-center text-[17px] text-[#6A738B]"
                              >
                                {hasScanData
                                  ? "No flagged bills found in the current scan."
                                  : "Run a scan to populate flagged bills."}
                              </td>
                            </tr>
                          )}
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
  icon: ReactNode
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

function EmptyPanelMessage({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-[16px] border border-dashed border-[#D8E1F0] bg-[#FBFCFF] px-6 text-center text-[16px] text-[#6A738B]">
      {message}
    </div>
  )
}
