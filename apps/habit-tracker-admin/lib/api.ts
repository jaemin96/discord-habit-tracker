const BASE_URL = 'http://localhost:4003';

export type CheckinType = 'camera_out' | 'work_disconnect' | 'workout' | 'report';

export interface ReportStats {
  daily: number;
  weekly: number;
  monthly: number;
  total: number;
}

export interface PeriodStats {
  period: 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  total: number;
  camera_out: number;
  work_disconnect: number;
  workout: number;
  report: ReportStats;
}

export interface DayTrend {
  date: string;
  total: number;
  camera_out: number;
  work_disconnect: number;
  workout: number;
  report: number;
}

export interface TypeBreakdown {
  camera_out: number;
  work_disconnect: number;
  workout: number;
  report: ReportStats;
}

export interface OverviewStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
  userCount: number;
  weeklyTrend: DayTrend[];
  typeBreakdown: TypeBreakdown;
  dailyBreakdown: TypeBreakdown;
  weeklyBreakdown: TypeBreakdown;
}

export interface DiscordUser {
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface Checkin {
  id: string;
  userId: string;
  date: string;
  type: CheckinType;
  description: string | null;
  customFields: { reportType?: string } | null;
  user: DiscordUser | null;
}

export interface CheckinListResponse {
  checkins: Checkin[];
  total: number;
  limit: number;
  offset: number;
}

export interface UserStat {
  userId: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  totalCheckins: number;
  weeklyCheckins: number;
  lastCheckin: string | null;
}

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface ReportMonthTrend {
  month: string;
  일일: number;
  주간: number;
  월간: number;
}

export const api = {
  overview: () => fetchApi<OverviewStats>('/api/analytics/overview'),
  weekly: (userId: string) => fetchApi<PeriodStats>(`/api/analytics/weekly?userId=${userId}`),
  monthly: (userId: string) => fetchApi<PeriodStats>(`/api/analytics/monthly?userId=${userId}`),
  checkins: (params?: { query?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.query) q.set('query', params.query);
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.offset) q.set('offset', String(params.offset));
    return fetchApi<CheckinListResponse>(`/api/analytics/checkins?${q.toString()}`);
  },
  users: () => fetchApi<UserStat[]>('/api/analytics/users'),
  reportMonthlyTrend: () => fetchApi<ReportMonthTrend[]>('/api/analytics/report-monthly-trend'),
};
