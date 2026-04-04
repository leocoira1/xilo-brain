"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts"
import { PlugZap, Shield, Users, Download } from "lucide-react"
import AppShell from "@/components/app/AppShell"
import { BRAND } from "@/components/app/app-config"
import {
  KpiCard,
  SectionCard,
  SummaryRow,
  LegendItem,
  StatusBadge,
} from "@/components/app/ui"

const settingsTrend = [
  { month: "Jan", value: 4 },
  { month: "Feb", value: 5 },
  { month: "Mar", value: 6 },
  { month: "Apr", value: 8 },
  { month: "May", value: 9 },
  { month: "Jun", value: 11 },
  { month: "Jul", value: 12 },
]

const integrations = [
  {
    name: "Claims Feed",
    owner: "Benefits Admin",
    status: "Confirmed Savings",
    health: "Active",
    updated: "2h ago",
  },
  {
    name: "Employee Messaging",
    owner: "HR Team",
    status: "Under Review",
    health: "Testing",
    updated: "1d ago",
  },
  {
    name: "AI Detection Engine",
    owner: "XILO Ops",
    status: "Confirmed Savings",
    health: "Active",
    updated: "Live",
  },
  {
    name: "TPA Sync",
    owner: "Plan Partner",
    status: "Pending Confirmation",
    health: "Pending",
    updated: "3d ago",
  },
]

export default function SettingsPage() {
  return (
    <AppShell title="Settings">
      <div className="space-y-4">
        <section className="grid grid-cols-3 gap-4">
          <KpiCard
            title="Active Integrations"
            value="12"
            subPrimary="+2"
            subRest="this month"
            icon={
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: BRAND.blueTint }}
              >
                <PlugZap
                  className="h-8 w-8"
                  style={{ color: BRAND.blue }}
                  strokeWidth={2.1}
                />
              </div>
            }
          />

          <KpiCard
            title="Security Policies"
            value="12"
            subPrimary="100%"
            subRest="compliant"
            icon={
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: BRAND.tealSoft }}
              >
                <Shield
                  className="h-8 w-8"
                  style={{ color: BRAND.teal }}
                  strokeWidth={2.1}
                />
              </div>
            }
          />

          <KpiCard
            title="Admin Users"
            value="5"
            subPrimary="2"
            subRest="super admins"
            icon={
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: BRAND.greenTint }}
              >
                <Users
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
              <h2 className="mb-4 text-[24px] font-semibold text-[#132447]">
                Integration Growth
              </h2>

              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={settingsTrend}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="settingsFill" x1="0" y1="0" x2="0" y2="1">
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
                      formatter={(value: number) => [value, "Active Integrations"]}
                    />

                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={BRAND.blue}
                      strokeWidth={3}
                      fill="url(#settingsFill)"
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
                  System Health
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
                  <div className="h-full w-[72%]" style={{ backgroundColor: BRAND.teal }} />
                  <div className="h-full w-[18%]" style={{ backgroundColor: BRAND.yellow }} />
                  <div className="h-full w-[10%]" style={{ backgroundColor: BRAND.gray }} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-8 text-[16px] text-[#3B4660]">
                <LegendItem color={BRAND.teal} label="Healthy 72%" />
                <LegendItem color={BRAND.yellow} label="Attention 18%" />
                <LegendItem color={BRAND.gray} label="Inactive 10%" />
              </div>
            </SectionCard>
          </div>

          <SectionCard>
            <div className="flex h-full min-h-[410px] flex-col">
              <div>
                <h2 className="mb-6 text-[24px] font-semibold text-[#132447]">
                  Configuration Summary
                </h2>

                <SummaryRow
                  label="Connected Systems"
                  value="12"
                  valueClass="text-[#132447]"
                />
                <SummaryRow
                  label="Active Policies"
                  value="12"
                  valueClass="text-[#166D7E]"
                />
                <SummaryRow
                  label="Admin Users"
                  value="5"
                  valueClass="text-[#1E98A4]"
                />
                <SummaryRow
                  label="Default SLA"
                  value="48 hrs"
                  valueClass="text-[#132447]"
                  noBorder
                />
              </div>

              <div className="mt-auto pt-8">
                <h3 className="mb-4 text-[22px] font-semibold text-[#132447]">
                  Configuration Progress
                </h3>

                <div className="mb-4 h-6 overflow-hidden rounded-full bg-[#DDE2EE]">
                  <div className="flex h-full w-full">
                    <div className="h-full w-[72%]" style={{ backgroundColor: BRAND.teal }} />
                    <div className="h-full w-[18%]" style={{ backgroundColor: BRAND.yellow }} />
                    <div className="h-full w-[10%]" style={{ backgroundColor: BRAND.gray }} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-8 text-[16px] text-[#3B4660]">
                  <LegendItem color={BRAND.teal} label="Configured 72%" />
                  <LegendItem color={BRAND.yellow} label="Review 18%" />
                  <LegendItem color={BRAND.gray} label="Inactive 10%" />
                </div>
              </div>
            </div>
          </SectionCard>
        </section>

        <SectionCard>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-[24px] font-semibold text-[#132447]">
              Integrations & Admin Controls
            </h2>

            <button className="flex items-center gap-2 rounded-xl border border-[#E5EAF5] bg-white px-4 py-2 text-sm font-semibold text-[#132447] shadow-sm hover:bg-[#F8FAFF]">
              <Download className="h-4 w-4" />
              Add New Integration
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-separate border-spacing-0">
              <thead>
                <tr className="bg-[#EEF1FA] text-left text-[15px] uppercase tracking-[0.02em] text-[#41506D]">
                  <th className="rounded-l-[8px] px-6 py-4 font-medium">Integration</th>
                  <th className="px-6 py-4 font-medium">Owner</th>
                  <th className="px-6 py-4 font-medium">Health</th>
                  <th className="px-6 py-4 font-medium">Updated</th>
                  <th className="rounded-r-[8px] px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>

              <tbody>
                {integrations.map((row) => (
                  <tr
                    key={row.name}
                    className="text-[18px] text-[#1D2740] transition hover:bg-[#F7FBFF]"
                  >
                    <td className="border-b border-[#E8EDF7] px-6 py-5 font-semibold">
                      {row.name}
                    </td>
                    <td className="border-b border-[#E8EDF7] px-6 py-5">{row.owner}</td>
                    <td className="border-b border-[#E8EDF7] px-6 py-5 font-semibold">
                      {row.health}
                    </td>
                    <td className="border-b border-[#E8EDF7] px-6 py-5">{row.updated}</td>
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
