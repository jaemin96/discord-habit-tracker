# 습관 트래커 서비스 설계 요약 (NestJS)

## 📐 아키텍처

```
discord-habit-tracker/
├── src/
│   ├── discord/          # Discord Bot (명령어 처리)
│   ├── checkin/          # 체크인 모듈
│   ├── workout/          # 운동 기록 모듈
│   ├── camera/           # 사진/카메라 모듈
│   ├── budget/           # 외부 예산 API 조회
│   ├── analytics/        # 통계 계산 & API
│   ├── database/         # Supabase/Prisma
│   └── common/           # 공통 (guards, pipes 등)
└── prisma/schema.prisma  # DB 스키마
```

---

## 🗄️ DB 스키마 (핵심만)

```prisma
// 1. 체크인
model Checkin {
  id           String   @id @default(uuid())
  userId       String
  date         DateTime @default(now())
  type         String   // "카메라외출", "업무단절"
  description  String?
  customFields Json?    // 커스텀 폼 데이터
  
  @@index([userId, date])
}

// 2. 운동
model Workout {
  id          String   @id @default(uuid())
  userId      String
  date        DateTime @default(now())
  type        String   // "헬스", "볼링"
  duration    Int?     // 분
  calories    Int?
  description String?
  
  // Apple Health 연동용 (미래)
  source      String   @default("manual")
  appleHealthId String?
  
  @@index([userId, date])
}

// 3. 사진
model Photo {
  id          String   @id @default(uuid())
  userId      String
  date        DateTime @default(now())
  
  // 파일
  fileName    String
  fileUrl     String
  fileSize    Int
  
  // EXIF
  camera      String?  // "Sony A6400"
  lens        String?
  iso         Int?
  shutterSpeed String?
  aperture    String?
  focalLength Int?
  
  location    String?
  description String?
  
  @@index([userId, date])
  @@index([camera])
}

// 4. 통계 캐시
model StatisticsCache {
  id        String   @id @default(uuid())
  userId    String
  period    String   // "weekly", "monthly"
  startDate DateTime
  data      Json     // 계산된 통계
  
  @@unique([userId, period, startDate])
}
```

---

## 🔧 모듈별 핵심 기능

### 1. 체크인 모듈 (최우선)

```typescript
// discord/commands/checkin.command.ts
@Command('체크인')
class CheckinCommand {
  @Option('항목') type: string;        // "카메라외출"
  @Option('메모') description?: string;
  
  // 커스텀 폼 지원
  async executeWithModal() {
    // Discord Modal로 입력받기
    // DB 저장 (customFields에 JSON)
  }
}

// checkin/checkin.service.ts
class CheckinService {
  async create(data) { ... }
  async getTodayCheckins(userId) { ... }
  async getWeeklyCount(userId, type) { ... }
}
```

**기능**
- `/체크인 카메라외출` → DB 저장
- `/체크인 업무단절 "18시 퇴근"` → 메모 포함
- 커스텀 폼 (Modal) 지원 가능

---

### 2. 운동 모듈

```typescript
// discord/commands/workout.command.ts
@Command('운동')
class WorkoutCommand {
  @SubCommand('기록')
  async log(
    @Option('종목') type: string,
    @Option('시간') duration?: number,
    @Option('칼로리') calories?: number,
  ) { ... }
  
  @SubCommand('조회')
  async getToday() { ... }
}

// workout/workout.service.ts
class WorkoutService {
  async create(data) { ... }
  async getTodayWorkouts(userId) { ... }
  async getWeeklyStats(userId) { ... }
}
```

**기능**
- `/운동 기록 헬스 60 300` → 수동 입력
- `/운동 조회` → 오늘 기록 확인
- (미래) Apple Health 웹훅 수신

---

### 3. 카메라/사진 모듈

```typescript
// discord/commands/photo.command.ts
@Command('사진')
class PhotoCommand {
  @SubCommand('업로드')
  async upload(@Attachment() file) {
    // 1. EXIF 추출
    // 2. Supabase Storage 업로드
    // 3. DB 저장
  }
  
  @SubCommand('통계')
  async stats() {
    // 총 촬영수, 자주 쓴 카메라/설정 등
  }
}

// camera/photo.service.ts
class PhotoService {
  async extractExif(buffer: Buffer) {
    // exifr 라이브러리 사용
    return { camera, lens, iso, ... };
  }
  
  async uploadPhoto(file, userId) { ... }
  
  async getUserStats(userId) {
    // 가장 많이 쓴 카메라, ISO, 조리개 등
  }
}
```

**기능**
- 사진 첨부 → EXIF 자동 추출
- 카메라, 렌즈, ISO, 셔터스피드 등 저장
- `/사진 통계` → 촬영 습관 분석

---

### 4. 예산 조회 모듈

```typescript
// budget/budget-api.service.ts
@Injectable()
class BudgetApiService {
  constructor(private readonly httpService: HttpService) {}
  
  // 외부 예산관리 서비스 API 호출
  async fetchDailyBudget(userId: string, date: Date) {
    const { data } = await this.httpService.get(
      `https://your-budget-service.com/api/stats/daily`,
      {
        params: { userId, date },
        headers: { Authorization: `Bearer ${API_KEY}` },
      }
    ).toPromise();
    
    return data; // { totalSpent, byCategory }
  }
  
  async fetchWeeklyBudget(userId: string) { ... }
  async fetchMonthlyBudget(userId: string) { ... }
}

// discord/commands/budget.command.ts
@Command('예산')
class BudgetCommand {
  @SubCommand('오늘')
  async today() {
    // 외부 API 호출 → Discord Embed 출력
    const data = await this.budgetApiService.fetchDailyBudget(...);
    
    return {
      embeds: [{
        title: '💰 오늘 지출',
        description: `총 ${data.totalSpent.toLocaleString()}원`,
        fields: data.byCategory.map(cat => ({ ... })),
      }],
    };
  }
}
```

**기능**
- `/예산 오늘` → 외부 API 호출해서 조회만
- 이 서비스는 **조회만**, 저장 안 함
- 외부 예산 서비스에서 통계 API 제공 필요

**외부 예산 서비스에서 제공해야 할 API**
```typescript
// 외부 예산관리 서비스에 이런 API 필요
GET /api/stats/daily?userId=xxx&date=2024-02-11
→ { totalSpent: 50000, byCategory: { 식비: 30000, ... } }

GET /api/stats/weekly?userId=xxx
→ { totalSpent: 200000, byCategory: { ... }, dailyAvg: 28571 }

GET /api/stats/monthly?userId=xxx
→ { totalSpent: 800000, byCategory: { ... }, trend: [...] }
```

---

### 5. 통계 API

```typescript
// analytics/analytics.service.ts
class AnalyticsService {
  async getWeeklyStats(userId: string) {
    // 캐시 확인
    const cached = await this.findCache(userId, 'weekly');
    if (cached && !isExpired(cached)) return cached.data;
    
    // 계산
    const [checkins, workouts, photos, budget] = await Promise.all([
      this.checkinService.getWeeklyData(userId),
      this.workoutService.getWeeklyData(userId),
      this.photoService.getWeeklyData(userId),
      this.budgetApiService.fetchWeeklyBudget(userId), // 외부 API
    ]);
    
    const stats = {
      checkin: { 카메라외출: 3, 업무단절: 5 },
      workout: { totalDuration: 180, totalCalories: 450 },
      photo: { totalPhotos: 47, avgISO: 800 },
      budget: { totalSpent: 200000, byCategory: { ... } },
    };
    
    // 캐시 저장
    await this.saveCache(userId, 'weekly', stats);
    
    return stats;
  }
}

// analytics/analytics.controller.ts
@Controller('api/analytics')
class AnalyticsController {
  @Get('weekly')
  async getWeekly(@Query('userId') userId: string) {
    return this.analyticsService.getWeeklyStats(userId);
  }
  
  @Get('monthly')
  async getMonthly(@Query('userId') userId: string) { ... }
  
  @Get('dashboard')
  async getDashboard(@Query('userId') userId: string) {
    // 모든 통계 한 번에
  }
}
```

**기능**
- 주간/월간 통계 계산
- 캐시로 성능 최적화
- REST API로 제공 (FE 연동 대비)

---

## 📊 개발 우선순위

| 순서 | 모듈 | 시간 | 효과 |
|------|------|------|------|
| 1 | **체크인** | 6~8h | ⭐⭐⭐ |
| 2 | **통계 API** | 4~6h | ⭐⭐⭐ |
| 3 | 운동 | 4~6h | ⭐⭐ |
| 4 | 사진 | 6~8h | ⭐⭐ |
| 5 | 예산 조회 | 2~4h | ⭐ |

---

## ✅ 1개월 실행 플랜

### Week 1: 기반 구축
```bash
# 1. NestJS 프로젝트 생성
nest new discord-habit-tracker

# 2. 라이브러리 설치
npm install @prisma/client discord.js @discordjs/rest
npm install exifr # EXIF 추출
npm install @nestjs/axios # HTTP 요청

# 3. Supabase 프로젝트 생성
# 4. Prisma 스키마 작성
# 5. Discord Bot 등록
```

### Week 2: 체크인 모듈
- [ ] DB 마이그레이션
- [ ] Discord 명령어 기본 구조
- [ ] /체크인 명령어 구현
- [ ] Supabase 저장
- [ ] 커스텀 폼 (Modal)

### Week 3: 통계 기초
- [ ] /주간리포트 명령어
- [ ] 통계 계산 로직
- [ ] 캐시 구현

### Week 4: 운동 모듈
- [ ] /운동 기록 명령어
- [ ] /운동 조회 명령어
- [ ] 주간 운동 통계

---

## 🚨 핵심 함정 대응

### 함정 1: "완벽하게 만들려고 함"
```
IF 기능 10개 추가하고 싶어짐
THEN "체크인 1개만 먼저 완성"
```

### 함정 2: "예산 연동부터 하려 함"
```
IF 예산 모듈 먼저 생각남
THEN "체크인부터, 예산은 나중에"
- 예산은 외부 API만 호출하면 됨 (2시간)
```

### 함정 3: "FE 만들고 싶어짐"
```
IF React 대시보드 만들고 싶어짐
THEN "API만 완성, FE는 3개월 후"
- 지금은 Discord 명령어로 충분
```

---

## 💬 예산 부분 정리

**핵심**: 외부 예산 서비스 REST API 호출만

**필요한 작업**
1. 외부 예산 서비스에 통계 API 추가 (**선행 작업**)
   ```typescript
   // 예산관리 서비스에 이런 API 만들어야 함
   GET /api/stats/daily
   GET /api/stats/weekly
   GET /api/stats/monthly
   ```

2. 습관 트래커에서 HTTP 요청만
   ```typescript
   // 단순 조회만, 저장 안 함
   this.httpService.get('외부API')
   ```

3. Discord 명령어로 출력
   ```typescript
   /예산 오늘 → 외부 API 결과 Embed 출력
   ```