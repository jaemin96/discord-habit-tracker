"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserActivityChart } from "@/components/dashboard/charts/user-activity-chart"
import { SalesBreakdownChart } from "@/components/dashboard/charts/sales-breakdown-chart"
import { ReportBreakdownChart } from "@/components/dashboard/charts/report-breakdown-chart"
import { RangeTrendChart, TYPE_COLORS, TYPE_KEYS } from "@/components/dashboard/charts/range-trend-chart"
import { Camera, Briefcase, Dumbbell, FileText, Languages, Loader2, Search } from "lucide-react"
import { api, OverviewStats, TypeBreakdown, RangeStats } from "@/lib/api"

type Granularity = "day" | "week" | "month" | "year"

const RANGE_TYPE_META = [
  { key: "camera_out", title: "카메라외출", icon: Camera },
  { key: "work_disconnect", title: "업무 외 학습", icon: Briefcase },
  { key: "workout", title: "운동", icon: Dumbbell },
  { key: "report", title: "리포트", icon: FileText },
  { key: "language_study", title: "외국어 공부", icon: Languages },
] as const

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

function getDefaultDates() {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 29)
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  }
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [loading, setLoading] = useState(true)

  const defaults = getDefaultDates()
  const [startDate, setStartDate] = useState(defaults.start)
  const [endDate, setEndDate] = useState(defaults.end)
  const [rangeStats, setRangeStats] = useState<RangeStats | null>(null)
  const [rangeLoading, setRangeLoading] = useState(false)
  const [rangeError, setRangeError] = useState<string | null>(null)
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set(TYPE_KEYS))
  const [granularity, setGranularity] = useState<Granularity>("day")

  function toggleType(key: string) {
    setActiveTypes((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        // 마지막 하나는 해제 불가
        if (next.size === 1) return prev
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  useEffect(() => {
    api.overview()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function handleRangeSearch() {
    if (!startDate || !endDate) return
    if (startDate > endDate) {
      setRangeError("시작일이 종료일보다 늦을 수 없습니다.")
      return
    }
    setRangeError(null)
    setRangeLoading(true)
    api.range(startDate, endDate)
      .then(setRangeStats)
      .catch(() => setRangeError("데이터를 불러오는 중 오류가 발생했습니다."))
      .finally(() => setRangeLoading(false))
  }

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

        {/* 기간별 통계 */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>기간별 통계</CardTitle>
              <CardDescription>특정 기간의 체크인 통계를 조회합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-end gap-3 mb-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">시작일</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">종료일</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <Button onClick={handleRangeSearch} disabled={rangeLoading} size="sm" className="gap-2">
                  {rangeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  조회
                </Button>
              </div>
              {rangeError && (
                <p className="text-sm text-destructive mb-3">{rangeError}</p>
              )}
              {rangeStats && !rangeLoading && (
                <div className="space-y-4">
                  {/* 타입별 카운트 카드 — 클릭으로 차트 필터 토글 */}
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    {RANGE_TYPE_META.map(({ key, title, icon: Icon }) => {
                      const value =
                        key === "report"
                          ? rangeStats.breakdown.report.total
                          : key === "language_study"
                          ? rangeStats.breakdown.language_study.total
                          : (rangeStats.breakdown as any)[key] as number
                      const isActive = activeTypes.has(key)
                      const color = TYPE_COLORS[key]
                      return (
                        <button
                          key={key}
                          onClick={() => toggleType(key)}
                          className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                            isActive
                              ? "border-border bg-background shadow-sm"
                              : "border-border/40 bg-muted/30 opacity-50"
                          }`}
                        >
                          <Icon
                            className="h-5 w-5 flex-shrink-0"
                            style={{ color: isActive ? color : undefined }}
                          />
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground truncate">{title}</p>
                            <p className="text-xl font-bold">
                              {value}
                              <span className="text-xs font-normal text-muted-foreground ml-1">회</span>
                            </p>
                          </div>
                          {/* 활성 상태 인디케이터 */}
                          <div
                            className={`ml-auto h-2 w-2 flex-shrink-0 rounded-full transition-opacity ${isActive ? "opacity-100" : "opacity-0"}`}
                            style={{ backgroundColor: color }}
                          />
                        </button>
                      )
                    })}
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
                    <span>
                      {rangeStats.startDate.toString().slice(0, 10)} ~ {rangeStats.endDate.toString().slice(0, 10)}
                    </span>
                    <span className="font-medium text-foreground">총 {rangeStats.total}회</span>
                  </div>

                  <RangeTrendChart
                    data={rangeStats.dailyTrend}
                    activeTypes={activeTypes}
                    granularity={granularity}
                    onGranularityChange={setGranularity}
                  />
                </div>
              )}
              {!rangeStats && !rangeLoading && (
                <p className="text-sm text-muted-foreground text-center py-6">날짜를 선택하고 조회 버튼을 클릭하세요.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2 mb-6">
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
