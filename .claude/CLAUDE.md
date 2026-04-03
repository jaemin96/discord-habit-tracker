## 금지 사항
- `npm run build`, `npm run dev` 등 전체 빌드를 임의로 실행하지 않기
- `npm test`로 전체 테스트를 돌리지 마라. 변경한 파일 관련 테스트만 실행하기
  - 예: `npx vitest run src/auth/login.test.ts`
- `eslint .`, `tsc --noEmit` 등 프로젝트 전체 린트/타입체크를 돌리지 않기
  - 변경 파일만: `eslint src/auth/login.ts`
- `npm install`을 임의로 실행하지 마라. 패키지 추가가 필요하면 먼저 물어보기
- 파일을 읽을 때 전체를 cat하지 말고, 필요한 부분만 sed나 head/tail로 읽기
- git log는 항상 `-n 10` 같은 제한걸기

## 작업 방식
- 코드 수정 후 검증이 필요하면 타입체크는 해당 파일만, 테스트도 해당 파일만 실행하기
- 빌드가 필요한 상황이면 실행하지 말고 나에게 확인 받기
- 에러가 나면 전체를 다시 돌리지 말고, 에러 메시지를 보고 해당 부분만 수정하기