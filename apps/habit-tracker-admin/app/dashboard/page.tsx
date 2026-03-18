import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { MetricCards } from "@/components/dashboard/metric-cards"
import { RevenueChart } from "@/components/dashboard/charts/revenue-chart"
import { UserActivityChart } from "@/components/dashboard/charts/user-activity-chart"
import { SalesBreakdownChart } from "@/components/dashboard/charts/sales-breakdown-chart"
import { RecentCheckins } from "@/components/dashboard/recent-checkins"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
          <p className="text-muted-foreground">
            디스코드 해빗트래커 현황을 한눈에 확인하세요.
          </p>
        </div>

        <MetricCards />

        <div className="grid gap-6 lg:grid-cols-3">
          <RevenueChart />
          <UserActivityChart />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentCheckins />
          </div>
          <SalesBreakdownChart />
        </div>
      </div>
    </DashboardLayout>
  )
}
