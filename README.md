# 잇다 (Itda)

> 사람과 사람을 잇다, 마음과 마음을 잇다.
> 끊어진 관계를 다시 잇는 앱 — 재연락의 용기, 사과와 용서, 화해의 여정.

## 문서

| 문서 | 내용 |
|---|---|
| [00-리서치보고서](docs/00-리서치보고서.md) | 심리학 근거(검증됨), 시장 분석, 데이터 수집 현실성, 오픈소스 |
| [01-아이디어](docs/01-아이디어.md) | 컨셉, 가치 제안, 타깃, 윤리 원칙, North Star |
| [02-기술스택](docs/02-기술스택.md) | Spring Boot + Java 21 / React Native + TS / PostgreSQL |
| [03-결정로그](docs/03-결정로그.md) | 모든 결정과 근거 (뒤집힌 것 포함) |
| [04-MVP-기능정의](docs/04-MVP-기능정의.md) | MVP: 관계 등록 → 추억 → 재연락 미션 → 결과 기록 |
| [05-B2B-회사갈등](docs/05-B2B-회사갈등.md) | Itda for Teams — 직장 갈등 화해 모듈 |
| [06-개발로드맵](docs/06-개발로드맵.md) | Phase 0~3, 마일스톤 지표 |
| [07-AI중재-설계](docs/07-AI중재-설계.md) | 화해 브리지: 개별 AI 상담 → 준비도 게이트 → 합동 중재, 프롬프트 설계 |
| [08-화면설계](docs/08-화면설계.md) | IA, 핵심 8화면 정의, 디자인 방향 + [UI 목업](docs/assets/ui-mockup.html) |
| [09-백로그](docs/09-백로그.md) | 전체 기능 추적 (완료/대기/아이디어) — 기획의 단일 관리 지점 |

## 핵심 근거 세 줄

1. 사람들은 옛 친구에게 연락하는 걸 낯선 사람에게 말 걸기만큼 어려워한다 — 하지만 **3분 워밍업 연습으로 실행률이 31%→53%** (Aknin & Sandstrom 2024, Nature Comm. Psychol.)
2. 연락받는 쪽은 보내는 쪽 예상보다 **더 반가워한다** (Liu et al. 2023 JPSP, 독립 재현 성공)
3. 용서는 훈련 가능하다 — **REACH 5단계 모델, 25편+ RCT 검증, 셀프 워크북 형식도 유효** (Worthington)

## 스택

Backend: Spring Boot 3.x + Java 21 · Mobile: React Native (Expo) + TypeScript · DB: PostgreSQL + Redis
