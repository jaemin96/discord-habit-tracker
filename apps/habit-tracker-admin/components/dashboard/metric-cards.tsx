"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, CalendarCheck, CalendarDays, CheckCircle2, Loader2 } from "lucide-react"
import { api, OverviewStats } from "@/lib/api"

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  loading?: boolean
}

function MetricCard({ title, value, subtitle, icon: Icon, loading }: MetricCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="rounded-lg bg-primary/10 p-2">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">불러오는 중...</span>
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </>
        )}
      </CardContent>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
    </Card>
  )
}

export function MetricCards() {
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.overview()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="오늘 체크인"
        value={stats?.today ?? 0}
        subtitle="오늘 기록된 체크인 수"
        icon={CheckCircle2}
        loading={loading}
      />
      <MetricCard
        title="이번 주 체크인"
        value={stats?.thisWeek ?? 0}
        subtitle="이번 주 월~일 합계"
        icon={CalendarCheck}
        loading={loading}
      />
      <MetricCard
        title="이번 달 체크인"
        value={stats?.thisMonth ?? 0}
        subtitle="이번 달 누적 체크인"
        icon={CalendarDays}
        loading={loading}
      />
      <MetricCard
        title="활성 사용자"
        value={stats?.userCount ?? 0}
        subtitle="전체 디스코드 사용자"
        icon={Users}
        loading={loading}
      />
    </div>
  )
}
