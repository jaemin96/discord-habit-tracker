"use client"

import { useEffect, useState, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { api, Checkin } from "@/lib/api"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

const TYPE_META: Record<string, { label: string; emoji: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  camera_out: { label: "카메라끄기", emoji: "📷", variant: "default" },
  work_disconnect: { label: "업무종료", emoji: "💼", variant: "secondary" },
  workout: { label: "운동", emoji: "💪", variant: "outline" },
  report: { label: "리포트", emoji: "📝", variant: "destructive" },
}

const PAGE_SIZE = 20

export default function CheckinsPage() {
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [userId, setUserId] = useState("")
  const [searchInput, setSearchInput] = useState("")

  const load = useCallback(async (pg: number, uid: string) => {
    setLoading(true)
    try {
      const res = await api.checkins({ userId: uid || undefined, limit: PAGE_SIZE, offset: pg * PAGE_SIZE })
      setCheckins(res.checkins)
      setTotal(res.total)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(page, userId)
  }, [page, userId, load])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const handleSearch = () => {
    setPage(0)
    setUserId(searchInput.trim())
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">체크인 현황</h1>
          <p className="text-muted-foreground">
            전체 체크인 기록을 조회합니다.
          </p>
        </div>

        {/* 검색 */}
        <div className="flex gap-2 max-w-sm">
          <Input
            placeholder="사용자 ID로 검색..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button variant="outline" size="icon" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
          {userId && (
            <Button variant="ghost" size="sm" onClick={() => { setUserId(""); setSearchInput(""); setPage(0) }}>
              초기화
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>체크인 목록</CardTitle>
            <CardDescription>
              {userId ? `사용자 ${userId}의 체크인` : "전체 체크인"} · 총 {total}건
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : checkins.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-12">
                체크인 데이터가 없습니다.
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">시간</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">사용자</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">타입</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">메모</th>
                      </tr>
                    </thead>
                    <tbody>
                      {checkins.map((c) => {
                        const meta = TYPE_META[c.type] ?? { label: c.type, emoji: "•", variant: "outline" as const }
                        const reportType = (c.customFields as any)?.reportType
                        return (
                          <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                              {format(new Date(c.date), "MM/dd HH:mm", { locale: ko })}
                            </td>
                            <td className="py-3 px-4 font-medium">{c.userId}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span>{meta.emoji}</span>
                                <Badge variant={meta.variant} className="text-xs">
                                  {meta.label}
                                  {reportType && ` · ${reportType}`}
                                </Badge>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground max-w-[200px] truncate">
                              {c.description ?? "-"}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 페이지네이션 */}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} / {total}건
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage((p) => p - 1)}
                      disabled={page === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">{page + 1} / {totalPages}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= totalPages - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
