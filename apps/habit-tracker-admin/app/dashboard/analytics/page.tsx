"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RevenueChart } from "@/components/dashboard/charts/revenue-chart"
import { UserActivityChart } from "@/components/dashboard/charts/user-activity-chart"
import { SalesBreakdownChart } from "@/components/dashboard/charts/sales-breakdown-chart"
import { Camera, Briefcase, Dumbbell, FileText, Loader2 } from "lucide-react"
import { api, OverviewStats } from "@/lib/api"

export default function AnalyticsPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.overview()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const breakdown = stats?.typeBreakdown
  const total = breakdown
    ? breakdown.camera_out + breakdown.work_disconnect + breakdown.workout + breakdown.report
    : 0

  const typeMetrics = [
    {
      title: "카메라끄기",
      value: breakdown?.camera_out ?? 0,
      icon: Camera,
      description: "카메라 끄기 체크인",
    },
    {
      title: "업무종료",
      value: breakdown?.work_disconnect ?? 0,
      icon: Briefcase,
      description: "업무 종료 체크인",
    },
    {
      title: "운동",
      value: breakdown?.workout ?? 0,
      icon: Dumbbell,
      description: "운동 체크인",
    },
    {
      title: "리포트",
      value: breakdown?.report ?? 0,
      icon: FileText,
      description: "일간/주간/월간 리포트",
    },
  ]

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">분석</h1>
          <p className="text-muted-foreground">체크인 통계와 트렌드를 분석합니다.</p>
        </div>

        {/* 이번 달 타입별 통계 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {typeMetrics.map((metric) => (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <metric.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{metric.value}회</div>
                    <p className="text-xs text-muted-foreground mt-2">{metric.description}</p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          <RevenueChart />
          <UserActivityChart />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <SalesBreakdownChart />
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>이번 달 체크인 비율</CardTitle>
              <CardDescription>타입별 체크인 분포</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {typeMetrics.map((item, i) => {
                    const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
                    const colors = ["bg-green-500", "bg-violet-500", "bg-amber-500", "bg-pink-500"]
                    return (
                      <div key={item.title} className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium truncate">{item.title}</span>
                            <span className="text-sm text-muted-foreground">{item.value}회</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${colors[i]} rounded-full transition-all`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-medium w-10 text-right">{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
