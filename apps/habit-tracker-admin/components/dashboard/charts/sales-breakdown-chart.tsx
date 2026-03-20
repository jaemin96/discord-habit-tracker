"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts"
import { useTheme } from "next-themes"
import { api } from "@/lib/api"
import { Loader2 } from "lucide-react"

const LIGHT_COLORS = {
  palette: ["#22c55e", "#8b5cf6", "#f59e0b", "#ec4899"],
  grid: "#e2e8f0",
  text: "#64748b",
  tooltipBg: "#ffffff",
}

const DARK_COLORS = {
  palette: ["#4ade80", "#a78bfa", "#fbbf24", "#f472b6"],
  grid: "#334155",
  text: "#94a3b8",
  tooltipBg: "#1e293b",
}

export function SalesBreakdownChart() {
  const [mounted, setMounted] = useState(false)
  const [breakdown, setBreakdown] = useState<{ camera_out: number; work_disconnect: number; workout: number; report: { total: number } }>({ camera_out: 0, work_disconnect: 0, workout: 0, report: { total: 0 } })
  const [loading, setLoading] = useState(true)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
    api.overview()
      .then((res) => setBreakdown(res.typeBreakdown))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const colors = mounted && resolvedTheme === "dark" ? DARK_COLORS : LIGHT_COLORS

  const data = [
    { name: "카메라외출", value: breakdown.camera_out },
    { name: "업무종료", value: breakdown.work_disconnect },
    { name: "운동", value: breakdown.workout },
    { name: "리포트", value: breakdown.report.total },
  ].filter((d) => d.value > 0)

  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>이번 달 체크인 분포</CardTitle>
        <CardDescription>타입별 체크인 비율</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : total === 0 ? (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground text-sm">이번 달 체크인 데이터가 없습니다.</p>
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={colors.palette[index % colors.palette.length]}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: colors.tooltipBg,
                    border: `1px solid ${colors.grid}`,
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    color: colors.text,
                  }}
                  labelStyle={{ color: colors.text }}
                  formatter={(value: number, name: string) => [
                    <span style={{ color: colors.text }}>{value}회 ({total > 0 ? Math.round((value / total) * 100) : 0}%)</span>,
                    <span style={{ color: colors.text }}>{name}</span>,
                  ]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span style={{ color: colors.text, fontSize: 12 }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
