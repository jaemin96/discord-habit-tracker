# discord-habit-tracker

## Docker

1. 환경 변수 파일 생성

```bash
cp .env.example .env
```

2. 컨테이너 빌드 및 실행

```bash
docker compose up -d --build
```

3. 로그 확인

```bash
docker compose logs -f habit-tracker-server
```

4. 종료

```bash
docker compose down
```
