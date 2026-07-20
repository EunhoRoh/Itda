# 잇다 (Itda) 🧵 — 작업 가이드 (Claude Code용)

끊어진 관계를 다시 잇는 앱. 재연락의 용기(연구 기반 넛지) + 사과·용서·화해 프로그램 + B2B 직장 갈등 확장.

## 세션 시작 시 반드시 읽을 것 (순서대로)
1. **[README.md](README.md)** — 문서 지도와 핵심 근거
2. **[docs/03-결정로그.md](docs/03-결정로그.md)** — 확정된 결정. 번복하려면 새 항목으로 추가 (줄 긋기 금지)
3. 작업 영역에 따라: 기능 범위 [docs/04](docs/04-MVP-기능정의.md) / 화면 [docs/08](docs/08-화면설계.md) / AI 중재 [docs/07](docs/07-AI중재-설계.md) / 근거 [docs/00](docs/00-리서치보고서.md)

## 절대 원칙 (윤리 — docs/01)
- **안전 스크리닝 우회 금지**: `Person.safetyConcern=true`면 재연락·화해 유도 기능 차단, 보호 안내로 분기
- **화해 강요 금지**: "연락 안 하고 마음만 정리"도 동등한 성공 경로. 죄책감 유발 카피 금지
- **메신저 만들지 않기**: 전송 버튼 없음 — 초안 복사 → 카톡/문자로 (결정로그 #9)
- SNS/카톡 친구 API로 소셜 그래프 수집 시도 금지 (기술적으로 불가, 결정로그 #3)

## 작업 규칙
- **결정이 생기면** → docs/03-결정로그.md에 추가
- 관계·감정·갈등 기록은 최고 민감 정보 — 로그 출력 금지, 실명 대신 별칭 허용 유지
- 스택: Spring Boot 4.1 + Java 21 (`backend/`, com.itda, domain/{기능} + global 구조), React Native Expo + TS (`mobile/`)
- 색/간격: `mobile/src/constants/theme.ts` 토큰만. hex 하드코딩 금지 (원본: docs/assets/ui-mockup.html)
- N+1 금지: 연관관계 LAZY, 목록은 프로젝션/fetch join

## 실행
- backend: `docker compose up -d` (Postgres **5433**) + `./gradlew bootRun` (API **8090**) — sealo(5432/8080)와 포트 분리
- mobile: `npx expo start --port 8082` (sealo가 8081 사용)

## 검증 (커밋 전 필수)
- backend: `./gradlew build` (테스트 포함, H2 인메모리라 Docker 불필요)
- mobile: `npx tsc --noEmit`
