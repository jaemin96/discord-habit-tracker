# Discord 습관 트래커 개발 로드맵

## Phase 0: 프로젝트 초기 설정

- [x] NestJS 프로젝트 생성
- [x] Git 저장소 초기화 및 .gitignore 설정
- [x] 필수 패키지 설치 (Prisma, Discord.js, axios 등)
- [x] 환경변수 파일 설정 (.env)
- [x] Discord Bot 생성 및 토큰 발급
- [x] Discord Bot을 개발 서버에 초대
- [x] Supabase 프로젝트 생성
- [x] Supabase 연결 정보 확인

## Phase 1: 데이터베이스 구축

- [x] Prisma 초기 설정 (schema.prisma 파일)
- [x] Checkin 모델 정의
- [x] Workout 모델 정의
- [x] Photo 모델 정의
- [x] StatisticsCache 모델 정의
- [x] Prisma 마이그레이션 실행
- [x] Prisma Client 생성 확인

## Phase 2: Discord Bot 기본 구조

- [x] Discord 모듈 생성
- [x] Bot Gateway 설정 및 연결 테스트
- [x] 명령어 핸들러 기본 구조 작성
- [x] 간단한 ping/pong 명령어로 연결 테스트

## Phase 3: 체크인 모듈 (최우선)

- [x] Checkin 모듈 생성
- [x] CheckinService 기본 CRUD 메서드 작성
- [x] /체크인 명령어 구현 (기본)
- [x] 체크인 타입 입력 받기 (카메라외출, 업무단절)
- [x] 메모 옵션 추가
- [x] DB 저장 로직 연결
- [x] 오늘 체크인 조회 기능
- [x] 주간 체크인 카운트 기능
- [x] 에러 핸들링 및 사용자 피드백
- [x] 체크인 타입 확장 (운동, 보고서 작성 추가)
- [x] 보고서 종류 구분 (일일/주간/월간) - customFields.reportType으로 저장
- [x] getWeeklyCount에 workout / report(daily·weekly·monthly) 통계 반영
- [x] getYearlyReportCount 메서드 추가 (연간 보고서 작성 현황)
- [ ] Discord Modal을 이용한 커스텀 폼 구현

## Phase 4: 기본 통계 API

- [x] Analytics 모듈 생성
- [x] AnalyticsService 기본 구조
- [x] 주간/월간 체크인 통계 계산 로직 (타입별 + 보고서 세분화)
- [x] StatisticsCache 저장/조회 로직
- [x] 캐시 만료 체크 로직 (30분 TTL)
- [x] /주간리포트 명령어 구현
- [x] /월간리포트 명령어 구현
- [x] Discord Embed 형태로 통계 출력
- [x] REST API 엔드포인트 생성 (GET /api/analytics/weekly, GET /api/analytics/monthly)

## Phase 5: 테스트 및 안정화

- [ ] 체크인 모듈 단위 테스트
- [ ] 통계 API 테스트
- [ ] Discord 명령어 통합 테스트
- [ ] 에러 로깅 시스템 구축
- [ ] 성능 모니터링 설정

## Phase 6: 배포 및 운영

- [ ] 배포 환경 설정 (Docker 또는 클라우드)
- [ ] 프로덕션 환경 변수 설정
- [ ] Bot을 실제 사용 서버에 초대
- [ ] 모니터링 도구 연결
- [ ] 백업 전략 수립
- [ ] 사용자 가이드 문서 작성

---

## 향후 업그레이드

### 운동 모듈

- [ ] Workout 모듈 생성
- [ ] WorkoutService 기본 CRUD 메서드
- [ ] /운동 기록 명령어 구현
- [ ] 운동 타입, 시간, 칼로리 입력 받기
- [ ] DB 저장 로직
- [ ] /운동 조회 명령어 (오늘 기록)
- [ ] 주간 운동 통계 계산
- [ ] Analytics 모듈에 운동 통계 통합
- [ ] Apple Health 연동 대비 필드 확인

### 사진/카메라 모듈

- [ ] Camera 모듈 생성
- [ ] PhotoService 기본 구조
- [ ] EXIF 추출 라이브러리 설정 (exifr)
- [ ] Supabase Storage 버킷 생성
- [ ] 파일 업로드 로직 구현
- [ ] EXIF 데이터 추출 로직
- [ ] Photo 모델에 데이터 저장
- [ ] /사진 업로드 명령어 구현
- [ ] /사진 통계 명령어 구현 (카메라별, 렌즈별 등)
- [ ] Analytics 모듈에 사진 통계 통합

### 예산 조회 모듈

- [ ] 외부 예산 서비스 API 스펙 확인
- [ ] 외부 예산 서비스에 통계 API 추가 요청/확인
- [ ] Budget 모듈 생성
- [ ] BudgetApiService HTTP 클라이언트 설정
- [ ] 일일 예산 조회 API 호출 로직
- [ ] 주간 예산 조회 API 호출 로직
- [ ] 월간 예산 조회 API 호출 로직
- [ ] /예산 오늘 명령어 구현
- [ ] /예산 주간 명령어 구현
- [ ] /예산 월간 명령어 구현
- [ ] Analytics 모듈에 예산 데이터 통합 (선택)

### 통합 통계 고도화

- [ ] 월간 통계 계산 로직
- [ ] 대시보드용 종합 통계 API
- [ ] 통계 캐시 최적화
- [ ] /대시보드 명령어 구현 (모든 통계 한눈에)
- [ ] 그래프/차트 데이터 포맷 준비 (향후 FE 대비)

### 기타 확장

- [ ] React 대시보드 FE 개발
- [ ] Apple Health 웹훅 연동
- [ ] 알림 및 리마인더 기능
- [ ] 다국어 지원
- [ ] 커스텀 체크인 항목 동적 추가 기능
- [ ] 운동 모듈 단위 테스트
- [ ] 사진 모듈 단위 테스트

---

## 핵심 원칙

- [ ] 1~4 Phase 완료 전에는 다른 기능 생각 금지
- [ ] 각 Phase는 독립적으로 동작하는 상태로 완성
- [ ] 테스트는 건너뛰지 않기
