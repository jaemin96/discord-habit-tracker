"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { api, DayTrend } from "@/lib/api"
import { Loader2 } from "lucide-react"

const LIGHT_COLORS = {
  total: "#22c55e",
  camera_out: "#8b5cf6",
  work_disconnect: "#3b82f6",
  workout: "#f59e0b",
  report: "#ec4899",
  language_study: "#0ea5e9",
  grid: "#e2e8f0",
  text: "#64748b",
  tooltipBg: "#ffffff",
}

const DARK_COLORS = {
  total: "#4ade80",
  camera_out: "#a78bfa",
  work_disconnect: "#60a5fa",
  workout: "#fbbf24",
  report: "#f472b6",
  language_study: "#38bdf8",
  grid: "#334155",
  text: "#94a3b8",
  tooltipBg: "#1e293b",
}

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"]

export function RevenueChart() {
  const [mounted, setMounted] = useState(false)
  const [data, setData] = useState<DayTrend[]>([])
  const [loading, setLoading] = useState(true)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
    api.overview()
      .then((res) => setData(res.weeklyTrend))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const colors = mounted && resolvedTheme === "dark" ? DARK_COLORS : LIGHT_COLORS

  const chartData = data.map((d, i) => ({
    day: DAY_LABELS[i] ?? d.date.slice(5),
    전체: d.total,
    카메라외출: d.camera_out,
    업무외학습: d.work_disconnect,
    운동: d.workout,
    리포트: d.report,
    외국어공부: d.language_study,
  }))

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle>주간 체크인 추이</CardTitle>
        <CardDescription>이번 주 일별 체크인 현황</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  {(["전체", "카메라외출", "업무외학습", "운동", "리포트", "외국어공부"] as const).map((key) => {
                    const colorKey = key === "전체" ? "total" : key === "카메라외출" ? "camera_out" : key === "업무외학습" ? "work_disconnect" : key === "운동" ? "workout" : key === "리포트" ? "report" : "language_study"
                    return (
                      <linearGradient key={key} id={`color_${colorKey}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={(colors as any)[colorKey]} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={(colors as any)[colorKey]} stopOpacity={0} />
                      </linearGradient>
                    )
                  })}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: colors.text, fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: colors.text, fontSize: 12 }}
                  allowDecimals={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: colors.tooltipBg,
                    border: `1px solid ${colors.grid}`,
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  labelStyle={{ color: colors.text }}
                />
                <Area type="monotone" dataKey="전체" stroke={colors.total} strokeWidth={2} fillOpacity={1} fill="url(#color_total)" />
                <Area type="monotone" dataKey="카메라외출" stroke={colors.camera_out} strokeWidth={2} fillOpacity={1} fill="url(#color_camera_out)" />
                <Area type="monotone" dataKey="업무외학습" stroke={colors.work_disconnect} strokeWidth={2} fillOpacity={1} fill="url(#color_work_disconnect)" />
                <Area type="monotone" dataKey="운동" stroke={colors.workout} strokeWidth={2} fillOpacity={1} fill="url(#color_workout)" />
                <Area type="monotone" dataKey="리포트" stroke={colors.report} strokeWidth={2} fillOpacity={1} fill="url(#color_report)" />
                <Area type="monotone" dataKey="외국어공부" stroke={colors.language_study} strokeWidth={2} fillOpacity={1} fill="url(#color_language_study)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="flex items-center justify-center flex-wrap gap-4 mt-4">
          {[
            { label: "전체", colorKey: "total" },
            { label: "카메라외출", colorKey: "camera_out" },
            { label: "업무 외 학습", colorKey: "work_disconnect" },
            { label: "운동", colorKey: "workout" },
            { label: "리포트", colorKey: "report" },
            { label: "외국어 공부", colorKey: "language_study" },
          ].map(({ label, colorKey }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: (colors as any)[colorKey] }} />
              <span className="text-sm text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
