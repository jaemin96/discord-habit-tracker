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
  Legend,
} from "recharts"
import { useTheme } from "next-themes"
import { api, ReportMonthTrend } from "@/lib/api"
import { Loader2 } from "lucide-react"

const LIGHT_COLORS = {
  daily: "#22c55e",
  weekly: "#8b5cf6",
  monthly: "#f59e0b",
  grid: "#e2e8f0",
  text: "#64748b",
  tooltipBg: "#ffffff",
  cursor: "rgba(0,0,0,0.05)",
}

const DARK_COLORS = {
  daily: "#4ade80",
  weekly: "#a78bfa",
  monthly: "#fbbf24",
  grid: "#334155",
  text: "#94a3b8",
  tooltipBg: "#1e293b",
  cursor: "rgba(255,255,255,0.05)",
}

export function ReportBreakdownChart() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ReportMonthTrend[]>([])
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
    api.reportMonthlyTrend()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const colors = mounted && resolvedTheme === "dark" ? DARK_COLORS : LIGHT_COLORS

  return (
    <Card>
      <CardHeader>
        <CardTitle>리포트 월별 추이</CardTitle>
        <CardDescription>최근 12개월 일일/주간/월간 리포트 횟수</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: colors.text, fontSize: 11 }}
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
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span style={{ color: colors.text, fontSize: 12 }}>{value}</span>
                  )}
                />
                <Bar dataKey="일일" fill={colors.daily} radius={[3, 3, 0, 0]} />
                <Bar dataKey="주간" fill={colors.weekly} radius={[3, 3, 0, 0]} />
                <Bar dataKey="월간" fill={colors.monthly} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
