"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { useTheme } from "next-themes"
import { DayTrend } from "@/lib/api"

const LIGHT_COLORS = {
  grid: "#e2e8f0",
  text: "#64748b",
  tooltipBg: "#ffffff",
  cursor: "rgba(0,0,0,0.05)",
}

const DARK_COLORS = {
  grid: "#334155",
  text: "#94a3b8",
  tooltipBg: "#1e293b",
  cursor: "rgba(255,255,255,0.05)",
}

export const TYPE_COLORS: Record<string, string> = {
  camera_out: "#22c55e",
  work_disconnect: "#8b5cf6",
  workout: "#f59e0b",
  report: "#ec4899",
  language_study: "#0ea5e9",
}

export const TYPE_LABELS: Record<string, string> = {
  camera_out: "카메라외출",
  work_disconnect: "업무외학습",
  workout: "운동",
  report: "리포트",
  language_study: "외국어",
}

export const TYPE_KEYS = Object.keys(TYPE_COLORS)

type Granularity = "day" | "week" | "month" | "year"

function getWeekKey(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  // ISO week start (Monday)
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day)
  return d.toISOString().split("T")[0]
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

function getYearKey(date: Date): string {
  return `${date.getFullYear()}`
}

function aggregateData(raw: DayTrend[], granularity: Granularity) {
  const map: Record<string, { total: number; camera_out: number; work_disconnect: number; workout: number; report: number; language_study: number }> = {}

  for (const d of raw) {
    const date = new Date(d.date)
    let key: string
    if (granularity === "day") key = d.date.slice(0, 10)
    else if (granularity === "week") key = getWeekKey(date)
    else if (granularity === "month") key = getMonthKey(date)
    else key = getYearKey(date)

    if (!map[key]) map[key] = { total: 0, camera_out: 0, work_disconnect: 0, workout: 0, report: 0, language_study: 0 }
    map[key].total += d.total
    map[key].camera_out += d.camera_out
    map[key].work_disconnect += d.work_disconnect
    map[key].workout += d.workout
    map[key].report += d.report
    map[key].language_study += d.language_study
  }

  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, vals]) => {
      let label = key
      if (granularity === "day") label = key.slice(5)           // MM-DD
      else if (granularity === "week") label = key.slice(5)     // MM-DD (주 시작일)
      else if (granularity === "month") label = key.slice(2)    // YY-MM
      // year: 그대로
      return { key, label, ...vals }
    })
}

const GRANULARITY_OPTIONS: { value: Granularity; label: string }[] = [
  { value: "day", label: "일" },
  { value: "week", label: "주" },
  { value: "month", label: "월" },
  { value: "year", label: "연" },
]

export function RangeTrendChart({
  data,
  activeTypes,
  granularity,
  onGranularityChange,
}: {
  data: DayTrend[]
  activeTypes: Set<string>
  granularity: Granularity
  onGranularityChange: (g: Granularity) => void
}) {
  const { resolvedTheme } = useTheme()
  const colors = resolvedTheme === "dark" ? DARK_COLORS : LIGHT_COLORS

  const chartData = aggregateData(data, granularity).map(({ label, ...vals }) => {
    const entry: Record<string, string | number> = { date: label }
    for (const key of TYPE_KEYS) {
      entry[TYPE_LABELS[key]] = (vals as any)[key]
    }
    return entry
  })

  const visibleTypes = TYPE_KEYS.filter((k) => activeTypes.has(k))

  return (
    <div className="space-y-3">
      {/* 집계 단위 버튼 */}
      <div className="flex items-center gap-1">
        {GRANULARITY_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onGranularityChange(value)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              granularity === value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 차트 */}
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              {TYPE_KEYS.map((type) => (
                <linearGradient key={type} id={`rng-grad-${type}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={TYPE_COLORS[type]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={TYPE_COLORS[type]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: colors.text, fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: colors.text, fontSize: 11 }}
              allowDecimals={false}
              width={24}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: colors.tooltipBg,
                border: `1px solid ${colors.grid}`,
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                fontSize: "12px",
              }}
              labelStyle={{ color: colors.text, marginBottom: 4 }}
              cursor={{ fill: colors.cursor }}
            />
            {visibleTypes.map((type) => (
              <Area
                key={type}
                dataKey={TYPE_LABELS[type]}
                stroke={TYPE_COLORS[type]}
                fill={`url(#rng-grad-${type})`}
                strokeWidth={1.5}
                dot={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
