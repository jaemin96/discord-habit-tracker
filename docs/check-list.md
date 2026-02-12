# Discord 습관 트래커 개발 로드맵

## Phase 0: 프로젝트 초기 설정

- [ ] NestJS 프로젝트 생성
- [ ] Git 저장소 초기화 및 .gitignore 설정
- [ ] 필수 패키지 설치 (Prisma, Discord.js, axios 등)
- [ ] 환경변수 파일 설정 (.env)
- [ ] Discord Bot 생성 및 토큰 발급
- [ ] Discord Bot을 개발 서버에 초대
- [ ] Supabase 프로젝트 생성
- [ ] Supabase 연결 정보 확인

## Phase 1: 데이터베이스 구축

- [ ] Prisma 초기 설정 (schema.prisma 파일)
- [ ] Checkin 모델 정의
- [ ] Workout 모델 정의
- [ ] Photo 모델 정의
- [ ] StatisticsCache 모델 정의
- [ ] Prisma 마이그레이션 실행
- [ ] Prisma Client 생성 확인

## Phase 2: Discord Bot 기본 구조

- [ ] Discord 모듈 생성
- [ ] Bot Gateway 설정 및 연결 테스트
- [ ] 명령어 핸들러 기본 구조 작성
- [ ] 간단한 ping/pong 명령어로 연결 테스트

## Phase 3: 체크인 모듈 (최우선)

- [ ] Checkin 모듈 생성
- [ ] CheckinService 기본 CRUD 메서드 작성
- [ ] /체크인 명령어 구현 (기본)
- [ ] 체크인 타입 입력 받기 (카메라외출, 업무단절)
- [ ] 메모 옵션 추가
- [ ] DB 저장 로직 연결
- [ ] 오늘 체크인 조회 기능
- [ ] 주간 체크인 카운트 기능
- [ ] Discord Modal을 이용한 커스텀 폼 구현
- [ ] 에러 핸들링 및 사용자 피드백

## Phase 4: 기본 통계 API

- [ ] Analytics 모듈 생성
- [ ] AnalyticsService 기본 구조
- [ ] 주간 체크인 통계 계산 로직
- [ ] StatisticsCache 저장/조회 로직
- [ ] 캐시 만료 체크 로직
- [ ] /주간리포트 명령어 구현
- [ ] Discord Embed 형태로 통계 출력
- [ ] REST API 엔드포인트 생성 (GET /api/analytics/weekly)

## Phase 5: 운동 모듈

- [ ] Workout 모듈 생성
- [ ] WorkoutService 기본 CRUD 메서드
- [ ] /운동 기록 명령어 구현
- [ ] 운동 타입, 시간, 칼로리 입력 받기
- [ ] DB 저장 로직
- [ ] /운동 조회 명령어 (오늘 기록)
- [ ] 주간 운동 통계 계산
- [ ] Analytics 모듈에 운동 통계 통합
- [ ] Apple Health 연동 대비 필드 확인

## Phase 6: 사진/카메라 모듈

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

## Phase 7: 예산 조회 모듈

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

## Phase 8: 통합 통계 고도화

- [ ] 월간 통계 계산 로직
- [ ] 대시보드용 종합 통계 API
- [ ] 통계 캐시 최적화
- [ ] /대시보드 명령어 구현 (모든 통계 한눈에)
- [ ] 그래프/차트 데이터 포맷 준비 (향후 FE 대비)

## Phase 9: 테스트 및 안정화

- [ ] 체크인 모듈 단위 테스트
- [ ] 운동 모듈 단위 테스트
- [ ] 사진 모듈 단위 테스트
- [ ] 통계 API 테스트
- [ ] Discord 명령어 통합 테스트
- [ ] 에러 로깅 시스템 구축
- [ ] 성능 모니터링 설정

## Phase 10: 배포 및 운영

- [ ] 배포 환경 설정 (Docker 또는 클라우드)
- [ ] 프로덕션 환경 변수 설정
- [ ] Bot을 실제 사용 서버에 초대
- [ ] 모니터링 도구 연결
- [ ] 백업 전략 수립
- [ ] 사용자 가이드 문서 작성

## 향후 확장 (나중에)

- [ ] React 대시보드 FE 개발
- [ ] Apple Health 웹훅 연동
- [ ] 알림 및 리마인더 기능
- [ ] 다국어 지원
- [ ] 커스텀 체크인 항목 동적 추가 기능

---

## 핵심 원칙

- [ ] 1~4 Phase 완료 전에는 다른 기능 생각 금지
- [ ] 각 Phase는 독립적으로 동작하는 상태로 완성
- [ ] 테스트는 건너뛰지 않기
