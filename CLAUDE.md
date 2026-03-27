# 행크옥션 경매 알림 서비스

## 프로젝트 구조

```
/
├── app/
│   ├── page.tsx              # 필터 설정 메인 페이지
│   ├── layout.tsx
│   └── api/
│       └── filters/
│           └── route.ts     # 필터 저장/조회 API
├── components/
│   ├── RegionSelector.tsx          # 지역 칩 선택 (정식 지역명: 서울특별시 등)
│   ├── TypeSelector.tsx            # 물건 종류 선택 (주거용/상업용 그룹)
│   ├── PriceRangeInput.tsx         # 가격 범위 드롭다운 (만원 단위 저장)
│   └── SpecialConditionSelector.tsx # 특수조건 칩 선택
├── lib/
│   └── supabase.ts           # Supabase 클라이언트
├── crawler/
│   ├── main.py               # 크롤러 진입점
│   ├── scraper.py            # 행크옥션 크롤링 (Playwright, 로그인 불필요)
│   ├── filter.py             # 필터 적용 로직
│   ├── kakao.py              # 카카오 알림 발송 + 토큰 자동 갱신
│   ├── get_kakao_token.py    # 카카오 리프레시 토큰 최초 발급 스크립트 (1회용)
│   └── requirements.txt
├── .github/
│   └── workflows/
│       └── weekly-crawl.yml  # 매주 월요일 9시 KST 실행
└── CLAUDE.md
```

## 기술 스택

- Frontend: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- DB: Supabase (필터 설정 저장, 발송 이력 관리)
- Crawler: Python 3.11 + Playwright (headless Chromium)
- Scheduler: GitHub Actions (매주 월요일 오전 9시 KST)
- 알림: 카카오 나에게 보내기 API (text 타입)
- 배포: Vercel (프론트), GitHub Actions (크롤러)

## Supabase 테이블 스키마

### filters 테이블 (필터 설정 저장)
```sql
create table filters (
  id uuid default gen_random_uuid() primary key,
  regions text[] default '{}',               -- 빈 배열 = 전국 / 값: '서울특별시', '경기도' 등 정식 지역명
  types text[] default '{}',                 -- 빈 배열 = 전체 / 값: '아파트', '다세대/빌라', '근린상가' 등
  appraise_min integer,                      -- 감정가 최소 (만원), null = 제한없음
  appraise_max integer,                      -- 감정가 최대 (만원), null = 제한없음
  bid_min integer,                           -- 최저입찰가 최소 (만원), null = 제한없음
  bid_max integer,                           -- 최저입찰가 최대 (만원), null = 제한없음
  special_conditions text[] default '{}',    -- 빈 배열 = 전체 / 값: '유치권', '지분경매', '재매각' 등
  filter_updated_at timestamptz default now(),
  last_crawled_at timestamptz
);
```

#### special_conditions 가능한 값
`유치권`, `지분경매`, `재매각`, `반값물건`, `대항력 있는 임차인`, `위반건축물`, `1년전감정가`, `오늘신건`, `HUG 대항력 포기`, `초보자 경매`

### sent_items 테이블 (발송 이력 — 중복 방지)
```sql
create table sent_items (
  case_number text,
  bid_date date not null,
  sent_at timestamptz default now(),
  primary key (case_number, bid_date)   -- 유찰 후 날짜 변경 시 재발송
);
```

## 환경 변수

### .env.local (프론트엔드)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### crawler/.env (로컬 테스트용)
```
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
KAKAO_REST_API_KEY=
KAKAO_CLIENT_SECRET=
KAKAO_REFRESH_TOKEN=
```

### GitHub Actions Secrets (크롤러 자동 실행)
```
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
KAKAO_REST_API_KEY=
KAKAO_CLIENT_SECRET=
KAKAO_REFRESH_TOKEN=
```

## 카카오톡 알림 메시지 형식

### 1) 첫 메시지 — 요약
```
🏠 경매 알림 — MM월 DD일
이번 주 신규 물건 N건 발견
[지역] | [물건종류]
```

### 2) 물건별 카드 (건당 1개 메시지)
```
🏠 [지역] 경매 [신건 or 유찰 N회]
[물건종류] | [주소]
⚠️ [특수조건] (있을 때만)
─────────────────
감정가:     N원
최저입찰가: N원 (N%)
입찰기일:   YYYY.MM.DD
면적:       건물 N㎡ / 토지 N㎡
```

카카오 API: text 타입 메시지 (feed 아님 — 글자 잘림 방지)

### 3) 신규 물건 없음
```
🏠 경매 알림 — MM월 DD일
조건에 맞는 신규 물건이 없습니다.
```

## 크롤러 핵심 로직

```python
# 실행 시작 시 카카오 액세스 토큰 자동 갱신
refresh_access_token()  # 리프레시 토큰으로 새 액세스 토큰 발급

# 조회 시작일: sent_items MAX(bid_date), 없으면 INITIAL_START_DATE
start_date = get_start_date()

# 크롤링 → 필터 → 중복 제거 → 발송
items = scrape_hauction(start_date=start_date)
filtered = apply_filters(items, config)
sent = get_sent_keys()  # (case_number, bid_date) 쌍으로 중복 체크
new_items = [i for i in filtered if (i.case_number, i.bid_date.isoformat()) not in sent]

if new_items:
    send_summary(len(new_items), config.regions, config.types)
    for item in new_items:
        send_item_card(item)
        save_sent_item(item.case_number, item.bid_date)
else:
    send_no_items()

update_last_crawled_at()
```

### filter.py 필터 적용 규칙
- `regions`: 빈 배열이면 전국, 값이 있으면 해당 지역만
- `types`: 빈 배열이면 전체, 값이 있으면 해당 종류만
- `appraise_min/max`: null이면 제한 없음 (만원 단위)
- `bid_min/max`: null이면 제한 없음 (만원 단위)
- `special_conditions`: 빈 배열이면 전체, 값이 있으면 해당 태그가 하나라도 붙은 물건만

### 유찰 재발송 규칙
`sent_items`의 PK가 `(case_number, bid_date)` 복합키라서, 같은 물건이 유찰 후 새 입찰일로 재등록되면 다시 알림이 발송됨.

## 크롤러 실행 방법

```bash
cd crawler
source venv/Scripts/activate  # Windows
python main.py --dry-run       # DB 저장/카톡 발송 없이 결과만 출력
python main.py                 # 실제 실행
```

## 카카오 토큰 관리

- **액세스 토큰**: 6시간 유효. 크롤러 실행 시마다 자동 갱신 (리프레시 토큰 사용)
- **리프레시 토큰**: 60일 유효. 사용할 때마다 60일 연장 → 매주 실행하면 사실상 영구
- **최초 발급**: `python get_kakao_token.py` 실행 → GitHub Secrets에 등록
- **리프레시 토큰 만료 시**: `get_kakao_token.py` 재실행 후 `KAKAO_REFRESH_TOKEN` Secret 업데이트

## GitHub Actions 스케줄

```yaml
on:
  schedule:
    - cron: '0 0 * * 1'  # 매주 월요일 00:00 UTC = 09:00 KST
  workflow_dispatch:       # 수동 실행 버튼 (테스트용, 반드시 포함)
```

### Ubuntu 24.04 playwright 주의사항
`playwright install-deps` 사용 불가 (libasound2 패키지명 변경). 대신 수동으로 시스템 패키지 설치:
```yaml
- name: Install system dependencies
  run: |
    sudo apt-get install -y \
      libnss3 libnspr4 libatk1.0-0t64 libatk-bridge2.0-0t64 \
      libcups2t64 libdrm2 libxkbcommon0 libxcomposite1 \
      libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2t64
```

## 코딩 컨벤션

- TypeScript strict mode 사용
- Tailwind 유틸리티 클래스만 사용 (별도 CSS 파일 금지)
- 컴포넌트는 components/ 에 분리 (src/ 없음)
- Python은 타입 힌트 필수, 함수 단위로 모듈 분리
- 에러 발생 시 카카오톡으로 에러 알림 발송

## 주의사항

- 행크옥션은 공식 API 없음 → Playwright로 JS 렌더링 크롤링
- 로그인 없이 크롤링 가능 — 매각기일 최신순 정렬 + 100개 표시로 대응
- 크롤링 셀렉터: `tr.info-row` (행 목록), 정렬 후 반드시 `page.wait_for_selector("tr.info-row")` 필요
- Supabase filters 테이블은 단일 row만 유지 (upsert 시 id 고정: `00000000-0000-0000-0000-000000000001`)

---

## React 학습 규칙 (중요 — 반드시 따를 것)

이 프로젝트의 사용자는 Vue 경험자이지만 **React는 처음**이다.
코드를 작성할 때 아래 규칙을 반드시 따른다.

### 규칙 1 — 코드 다음에 "React 포인트" 섹션을 항상 붙인다

코드 블록을 작성한 직후, 아래 형식의 설명을 반드시 추가한다.

```
---
#### ⚛️ React 포인트

**이 파일의 역할**
한 줄로: 이 컴포넌트/파일이 전체 구조에서 어떤 역할인지.

**Vue랑 다른 점**
Vue의 XX와 동일한 개념이지만, React에서는 YY 방식으로 쓴다.

**왜 이렇게 짰나**
- `useState`: 왜 여기서 썼는지, 안 쓰면 어떻게 되는지
- `useEffect`: 언제 실행되는지, 의존성 배열 [] 의 의미
- (해당 파일에 등장한 개념만 골라서 설명)

**Vue → React 치트시트 (이 파일 기준)**
| Vue | React (이 파일) |
|-----|----------------|
| v-model | useState + onChange |
| @click | onClick |
```

### 규칙 2 — 설명 수준

- Vue를 안다는 전제로 설명한다. "컴포넌트가 뭔지"부터 설명하지 않는다.
- React에서 Vue와 다르게 동작하는 부분만 짚는다.
- "왜 이렇게 하는지"를 항상 함께 설명한다. 단순히 "이렇게 쓴다"로 끝내지 않는다.
- 코드 안에 주석을 빽빽하게 넣지 않는다. 설명은 코드 블록 밖 "React 포인트" 섹션에 모은다.

### 규칙 3 — 새로운 React 개념이 등장할 때

`useCallback`, `useMemo`, `useRef`, `Context API` 등 새 개념이 처음 등장하면
"왜 지금 이게 필요한지"를 먼저 설명하고 코드를 작성한다.
"그냥 관례라서" 같은 설명은 하지 않는다.

### 규칙 4 — 컴포넌트 분리 시

새 컴포넌트를 만들 때 항상 이 두 가지를 설명한다.
1. 왜 이 코드를 별도 파일로 분리했는지 (안 분리하면 어떤 문제가 생기는지)
2. 부모-자식 간 데이터 흐름 (props가 어떤 방향으로 흐르는지)
