"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
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
  secondary: "#8b5cf6",
  tertiary: "#f59e0b",
  grid: "#e2e8f0",
  text: "#64748b",
  tooltipBg: "#ffffff",
  cursor: "rgba(0,0,0,0.05)",
}

const DARK_COLORS = {
  primary: "#4ade80",
  secondary: "#a78bfa",
  tertiary: "#fbbf24",
  grid: "#334155",
  text: "#94a3b8",
  tooltipBg: "#1e293b",
  cursor: "rgba(255,255,255,0.05)",
}

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"]

export function UserActivityChart() {
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
    카메라외출: d.camera_out,
    업무종료: d.work_disconnect,
    운동: d.workout,
    리포트: d.report,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>타입별 체크인</CardTitle>
        <CardDescription>이번 주 체크인 유형 분포</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                  cursor={{ fill: colors.cursor }}
                />
                <Bar dataKey="카메라외출" fill={colors.primary} radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="업무종료" fill={colors.secondary} radius={[0, 0, 0, 0]} stackId="a" />
                <Bar dataKey="운동" fill={colors.tertiary} radius={[0, 0, 0, 0]} stackId="a" />
                <Bar dataKey="리포트" fill="#ec4899" radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="flex items-center justify-center flex-wrap gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: colors.primary }} />
            <span className="text-sm text-muted-foreground">카메라외출</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: colors.secondary }} />
            <span className="text-sm text-muted-foreground">업무종료</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: colors.tertiary }} />
            <span className="text-sm text-muted-foreground">운동</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-pink-500" />
            <span className="text-sm text-muted-foreground">리포트</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
