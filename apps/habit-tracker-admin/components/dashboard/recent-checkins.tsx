"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { Loader2, User } from "lucide-react"
import { api, Checkin } from "@/lib/api"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

const TYPE_LABEL: Record<string, { label: string; emoji: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  camera_out: { label: "카메라외출", emoji: "📷", variant: "default" },
  work_disconnect: { label: "업무 외 학습", emoji: "📚", variant: "secondary" },
  workout: { label: "운동", emoji: "💪", variant: "outline" },
  report: { label: "리포트", emoji: "📝", variant: "destructive" },
}

export function RecentCheckins() {
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.checkins({ limit: 10 })
      .then((res) => setCheckins(res.checkins))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>최근 체크인</CardTitle>
        <CardDescription>가장 최근 기록된 체크인 10건</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : checkins.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">체크인 데이터가 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {checkins.map((c) => {
              const meta = TYPE_LABEL[c.type] ?? { label: c.type, emoji: "•", variant: "outline" as const }
              const reportType = (c.customFields as any)?.reportType
              return (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {c.user?.avatarUrl ? (
                        <Image
                          src={c.user.avatarUrl}
                          alt={c.user.displayName}
                          width={28}
                          height={28}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-3.5 w-3.5 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium leading-none">
                          {c.user?.displayName ?? c.userId}
                        </span>
                        <Badge variant={meta.variant} className="text-xs">
                          {meta.emoji} {meta.label}
                          {reportType && ` (${reportType})`}
                        </Badge>
                      </div>
                      {c.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{c.description}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    {format(new Date(c.date), "M/d HH:mm", { locale: ko })}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
