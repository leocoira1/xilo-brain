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
import { Users, Mail, ShieldCheck } from "lucide-react"
import AppShell from "@/components/app/AppShell"
import { BRAND } from "@/components/app/app-config"
import {
  KpiCard,
  SectionCard,
  SummaryRow,
  LegendItem,
  StatusBadge,
} from "@/components/app/ui"

const employeeTrend = [
  { month: "Jan", value: 42 },
  { month: "Feb", value: 61 },
  { month: "Mar", value: 78 },
  { month: "Apr", value: 96 },
  { month: "May", value: 118 },
  { month: "Jun", value: 134 },
  { month: "Jul", value: 151 },
]

const employees = [
  {
    id: "EMP-1042",
    name: "Ava Thompson",
    requests: "4",
    status: "Confirmed Savings",
    savings: "$2,840",
    engagement: "High",
  },
  {
    id: "EMP-1189",
    name: "Daniel Cruz",
    requests: "2",
    status: "Pending Confirmation",
    savings: "$1,420",
    engagement: "Medium",
  },
  {
    id: "EMP-1265",
    name: "Mia Patel",
    requests: "3",
    status: "Under Review",
    savings: "$980",
    engagement: "High",
  },
  {
    id: "EMP-1328",
    name: "Lucas Reed",
    requests: "1",
    status: "New / AI Flagged",
    savings: "$640",
    engagement: "Low",
  },
]

export default function EmployeesPage() {
  const router = useRouter()

  return (
    <AppShell title="Employees">
      <div className="space-y-4">
        <section className="grid grid-cols-3 gap-4">
          <KpiCard
            title="Employees Protected"
            value="151"
            subPrimary="+12"
            subRest="this month"
            icon={
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: BRAND.blueTint }}
              >
                <Users
                  className="h-8 w-8"
                  style={{ color: BRAND.blue }}
                  strokeWidth={2.1}
                />
              </div>
            }
          />

          <KpiCard
            title="Requests Sent"
            value="87"
            subPrimary="76%"
            subRest="participation rate"
            icon={
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: BRAND.tealSoft }}
              >
                <Mail
                  className="h-8 w-8"
                  style={{ color: BRAND.teal }}
                  strokeWidth={2.1}
                />
              </div>
            }
          />

          <KpiCard
            title="Confirmed Responses"
            value="58"
            subPrimary="87%"
            subRest="usable for review"
            icon={
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: BRAND.greenTint }}
              >
                <ShieldCheck
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
                Employee Participation Over Time
              </h2>

              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={employeeTrend}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="employeeFill" x1="0" y1="0" x2="0" y2="1">
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
                      formatter={(value: number) => [value, "Employees"]}
                    />

                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={BRAND.blue}
                      strokeWidth={3}
                      fill="url(#employeeFill)"
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
                  Participation Mix
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
                  <div className="h-full w-[76%]" style={{ backgroundColor: BRAND.teal }} />
                  <div className="h-full w-[24%]" style={{ backgroundColor: BRAND.gray }} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-8 text-[16px] text-[#3B4660]">
                <LegendItem color={BRAND.teal} label="Participating 76%" />
                <LegendItem color={BRAND.gray} label="No response 24%" />
              </div>
            </SectionCard>
          </div>

          <SectionCard>
            <div className="flex h-full min-h-[410px] flex-col">
              <div>
                <h2 className="mb-6 text-[24px] font-semibold text-[#132447]">
                  Employee Response Summary
                </h2>

                <SummaryRow
                  label="Requests Sent"
                  value="87"
                  valueClass="text-[#132447]"
                />
                <SummaryRow
                  label="Responses Received"
                  value="66"
                  valueClass="text-[#166D7E]"
                />
                <SummaryRow
                  label="Confirmed Responses"
                  value="58"
                  valueClass="text-[#1E98A4]"
                />
                <SummaryRow
                  label="Avg Response Time"
                  value="14 hrs"
                  valueClass="text-[#132447]"
                  noBorder
                />
              </div>

              <div className="mt-auto pt-8">
                <h3 className="mb-4 text-[22px] font-semibold text-[#132447]">
                  Response Progress
                </h3>

                <div className="mb-4 h-6 overflow-hidden rounded-full bg-[#DDE2EE]">
                  <div className="flex h-full w-full">
                    <div className="h-full w-[67%]" style={{ backgroundColor: BRAND.teal }} />
                    <div className="h-full w-[20%]" style={{ backgroundColor: BRAND.yellow }} />
                    <div className="h-full w-[13%]" style={{ backgroundColor: BRAND.gray }} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-8 text-[16px] text-[#3B4660]">
                  <LegendItem color={BRAND.teal} label="Confirmed 67%" />
                  <LegendItem color={BRAND.yellow} label="Pending 20%" />
                  <LegendItem color={BRAND.gray} label="No Response 13%" />
                </div>
              </div>
            </div>
          </SectionCard>
        </section>

        <SectionCard>
          <h2 className="mb-4 text-[24px] font-semibold text-[#132447]">
            Employee Response Queue
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-separate border-spacing-0">
              <thead>
                <tr className="bg-[#EEF1FA] text-left text-[15px] uppercase tracking-[0.02em] text-[#41506D]">
                  <th className="rounded-l-[8px] px-6 py-4 font-medium">Employee ID</th>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Requests</th>
                  <th className="px-6 py-4 font-medium">Engagement</th>
                  <th className="px-6 py-4 font-medium">Savings</th>
                  <th className="rounded-r-[8px] px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>

              <tbody>
                {employees.map((employee) => (
                  <tr
                    key={employee.id}
                    onClick={() => router.push("/employees")}
                    className="cursor-pointer text-[18px] text-[#1D2740] transition hover:bg-[#F7FBFF]"
                  >
                    <td className="border-b border-[#E8EDF7] px-6 py-5 font-semibold">
                      {employee.id}
                    </td>
                    <td className="border-b border-[#E8EDF7] px-6 py-5">{employee.name}</td>
                    <td className="border-b border-[#E8EDF7] px-6 py-5">{employee.requests}</td>
                    <td className="border-b border-[#E8EDF7] px-6 py-5 font-semibold">
                      {employee.engagement}
                    </td>
                    <td className="border-b border-[#E8EDF7] px-6 py-5 font-semibold">
                      {employee.savings}
                    </td>
                    <td className="border-b border-[#E8EDF7] px-6 py-5">
                      <div onClick={(e) => e.stopPropagation()}>
                        <StatusBadge status={employee.status} />
                      </div>
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
