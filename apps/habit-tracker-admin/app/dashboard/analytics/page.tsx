"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RevenueChart } from "@/components/dashboard/charts/revenue-chart"
import { UserActivityChart } from "@/components/dashboard/charts/user-activity-chart"
import { SalesBreakdownChart } from "@/components/dashboard/charts/sales-breakdown-chart"
import { ReportBreakdownChart } from "@/components/dashboard/charts/report-breakdown-chart"
import { Camera, Briefcase, Dumbbell, FileText, Languages, Loader2 } from "lucide-react"
import { api, OverviewStats, TypeBreakdown } from "@/lib/api"

const LANGUAGE_META: Record<string, { emoji: string; label: string }> = {
  japanese: { emoji: "🇯🇵", label: "일본어" },
  english: { emoji: "🇺🇸", label: "영어" },
}

function TypeCard({
  title,
  icon: Icon,
  loading,
  daily,
  weekly,
  monthly,
  isReport,
  reportBreakdown,
  isLanguage,
  languageBreakdown,
}: {
  title: string
  icon: React.ElementType
  loading: boolean
  daily: number
  weekly: number
  monthly: number
  isReport?: boolean
  reportBreakdown?: { daily: { d: number; w: number; m: number }; weekly: { d: number; w: number; m: number }; monthly: { d: number; w: number; m: number } }
  isLanguage?: boolean
  languageBreakdown?: { langs: { key: string; d: number; w: number; m: number }[] }
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <div className="space-y-3">
            <div className={`grid ${isReport ? "grid-cols-4" : "grid-cols-3"} gap-2 text-center`}>
              {isReport && <div />}
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">오늘</p>
                <p className="text-xl font-bold">{daily}</p>
              </div>
              <div className="border-x border-border">
                <p className="text-xs text-muted-foreground mb-0.5">이번 주</p>
                <p className="text-xl font-bold">{weekly}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">이번 달</p>
                <p className="text-xl font-bold">{monthly}</p>
              </div>
            </div>
            {isReport && reportBreakdown && (
              <div className="border-t border-border pt-2 space-y-1.5">
                {[
                  { label: "📝 일일", vals: reportBreakdown.daily },
                  { label: "📊 주간", vals: reportBreakdown.weekly },
                  { label: "📅 월간", vals: reportBreakdown.monthly },
                ].map(({ label, vals }) => (
                  <div key={label} className="grid grid-cols-4 items-center gap-1 text-xs">
                    <span className="text-muted-foreground font-medium">{label}</span>
                    <span className="text-center text-foreground font-medium">{vals.d}회</span>
                    <span className="text-center text-foreground font-medium">{vals.w}회</span>
                    <span className="text-center text-foreground font-medium">{vals.m}회</span>
                  </div>
                ))}
              </div>
            )}
            {isLanguage && languageBreakdown && languageBreakdown.langs.length > 0 && (
              <div className="border-t border-border pt-2 space-y-1.5">
                {languageBreakdown.langs.map(({ key, d, w, m }) => {
                  const meta = LANGUAGE_META[key] ?? { emoji: "🌐", label: key }
                  return (
                    <div key={key} className="grid grid-cols-4 items-center gap-1 text-xs">
                      <span className="text-muted-foreground font-medium">{meta.emoji} {meta.label}</span>
                      <span className="text-center text-foreground font-medium">{d}회</span>
                      <span className="text-center text-foreground font-medium">{w}회</span>
                      <span className="text-center text-foreground font-medium">{m}회</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.overview()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const d = stats?.dailyBreakdown
  const w = stats?.weeklyBreakdown
  const m = stats?.typeBreakdown // typeBreakdown = 이번 달

  // 이번 달 기준 비율 계산용
  const monthTotal = m
    ? m.camera_out + m.work_disconnect + m.workout + m.report.total + (m.language_study?.total ?? 0)
    : 0

  const typeMetrics = [
    { title: "카메라외출", icon: Camera, daily: d?.camera_out ?? 0, weekly: w?.camera_out ?? 0, monthly: m?.camera_out ?? 0 },
    { title: "업무 외 학습", icon: Briefcase, daily: d?.work_disconnect ?? 0, weekly: w?.work_disconnect ?? 0, monthly: m?.work_disconnect ?? 0 },
    { title: "운동", icon: Dumbbell, daily: d?.workout ?? 0, weekly: w?.workout ?? 0, monthly: m?.workout ?? 0 },
  ]

  // 언어별 세부 분류 (오늘/이번주/이번달 공통 언어 키 합산)
  const allLangKeys = Array.from(new Set([
    ...Object.keys(d?.language_study ?? {}).filter((k) => k !== 'total'),
    ...Object.keys(w?.language_study ?? {}).filter((k) => k !== 'total'),
    ...Object.keys(m?.language_study ?? {}).filter((k) => k !== 'total'),
  ]))
  const langBreakdownData = {
    langs: allLangKeys.map((key) => ({
      key,
      d: (d?.language_study as any)?.[key] ?? 0,
      w: (w?.language_study as any)?.[key] ?? 0,
      m: (m?.language_study as any)?.[key] ?? 0,
    })),
  }

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">분석</h1>
          <p className="text-muted-foreground">체크인 통계와 트렌드를 분석합니다.</p>
        </div>

        {/* 타입별 통계 카드 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
          {typeMetrics.map((metric) => (
            <TypeCard
              key={metric.title}
              title={metric.title}
              icon={metric.icon}
              loading={loading}
              daily={metric.daily}
              weekly={metric.weekly}
              monthly={metric.monthly}
            />
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 mb-6">
          {/* 리포트 카드 - 일일/주간/월간 세부 분류 포함 */}
          <TypeCard
            title="리포트"
            icon={FileText}
            loading={loading}
            daily={d?.report.total ?? 0}
            weekly={w?.report.total ?? 0}
            monthly={m?.report.total ?? 0}
            isReport
            reportBreakdown={{
              daily: { d: d?.report.daily ?? 0, w: w?.report.daily ?? 0, m: m?.report.daily ?? 0 },
              weekly: { d: d?.report.weekly ?? 0, w: w?.report.weekly ?? 0, m: m?.report.weekly ?? 0 },
              monthly: { d: d?.report.monthly ?? 0, w: w?.report.monthly ?? 0, m: m?.report.monthly ?? 0 },
            }}
          />

          {/* 외국어 공부 카드 - 언어별 세부 분류 포함 */}
          <TypeCard
            title="외국어 공부"
            icon={Languages}
            loading={loading}
            daily={d?.language_study?.total ?? 0}
            weekly={w?.language_study?.total ?? 0}
            monthly={m?.language_study?.total ?? 0}
            isLanguage
            languageBreakdown={langBreakdownData}
          />
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          <RevenueChart />
          <UserActivityChart />
          <ReportBreakdownChart />
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
                  {[
                    { title: "카메라외출", value: m?.camera_out ?? 0, color: "bg-green-500" },
                    { title: "업무 외 학습", value: m?.work_disconnect ?? 0, color: "bg-violet-500" },
                    { title: "운동", value: m?.workout ?? 0, color: "bg-amber-500" },
                    { title: "리포트", value: m?.report.total ?? 0, color: "bg-pink-500" },
                    { title: "외국어 공부", value: m?.language_study?.total ?? 0, color: "bg-sky-500" },
                  ].map((item) => {
                    const pct = monthTotal > 0 ? Math.round((item.value / monthTotal) * 100) : 0
                    return (
                      <div key={item.title} className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium truncate">{item.title}</span>
                            <span className="text-sm text-muted-foreground">{item.value}회</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${item.color} rounded-full transition-all`}
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
