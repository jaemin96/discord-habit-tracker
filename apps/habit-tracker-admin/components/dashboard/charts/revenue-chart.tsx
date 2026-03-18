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
  primary: "#22c55e",
  secondary: "#3b82f6",
  grid: "#e2e8f0",
  text: "#64748b",
  tooltipBg: "#ffffff",
}

const DARK_COLORS = {
  primary: "#4ade80",
  secondary: "#60a5fa",
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
    total: d.total,
    workout: d.workout,
    camera_out: d.camera_out,
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
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorWorkout" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.secondary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={colors.secondary} stopOpacity={0} />
                  </linearGradient>
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
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke={colors.primary}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                  name="전체 체크인"
                />
                <Area
                  type="monotone"
                  dataKey="workout"
                  stroke={colors.secondary}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorWorkout)"
                  name="운동"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: colors.primary }} />
            <span className="text-sm text-muted-foreground">전체 체크인</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: colors.secondary }} />
            <span className="text-sm text-muted-foreground">운동</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
