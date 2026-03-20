"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, TrendingUp, User } from "lucide-react"
import { api, UserStat } from "@/lib/api"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

export default function UsersPage() {
  const [users, setUsers] = useState<UserStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.users()
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">사용자 통계</h1>
          <p className="text-muted-foreground">
            디스코드 사용자별 체크인 현황입니다.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>사용자 목록</CardTitle>
            <CardDescription>전체 체크인 횟수 기준 정렬</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : users.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-12">
                사용자 데이터가 없습니다.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">사용자</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium">전체 체크인</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium">이번 주</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium">마지막 체크인</th>
                      <th className="text-center py-3 px-4 text-muted-foreground font-medium">활동</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => {
                      const isActive = u.weeklyCheckins > 0
                      return (
                        <tr key={u.userId} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                                {u.avatarUrl ? (
                                  <Image
                                    src={u.avatarUrl}
                                    alt={u.displayName ?? u.userId}
                                    width={32}
                                    height={32}
                                    className="rounded-full object-cover"
                                  />
                                ) : (
                                  <User className="h-4 w-4 text-primary" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{u.displayName ?? u.userId}</p>
                                <p className="text-xs text-muted-foreground">
                                  {u.username ? `@${u.username}` : u.userId}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold">{u.totalCheckins}회</td>
                          <td className="py-3 px-4 text-right">
                            <span className={u.weeklyCheckins > 0 ? "text-green-500 font-medium" : "text-muted-foreground"}>
                              {u.weeklyCheckins}회
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-muted-foreground">
                            {u.lastCheckin
                              ? format(new Date(u.lastCheckin), "M/d HH:mm", { locale: ko })
                              : "-"}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
                              {isActive ? "활성" : "비활성"}
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
