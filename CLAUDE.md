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
│   ├── SpecialConditionSelector.tsx # 특수조건 칩 선택
│   └── LookbackSelect.tsx          # 소급 기간 선택
├── lib/
│   └── supabase.ts           # Supabase 클라이언트
├── crawler/
│   ├── main.py               # 크롤러 진입점
│   ├── scraper.py            # 행크옥션 크롤링
│   ├── filter.py             # 필터 적용 로직
│   ├── kakao.py              # 카카오 알림 발송
│   └── requirements.txt
├── .github/
│   └── workflows/
│       └── weekly-crawl.yml  # 매주 월요일 9시 KST 실행
└── CLAUDE.md
```

## 기술 스택

- Frontend: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- DB: Supabase (필터 설정 저장, 발송 이력 관리)
- Crawler: Python 3.11
- Scheduler: GitHub Actions (매주 월요일 오전 9시 KST)
- 알림: 카카오 나에게 보내기 API
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
  lookback_weeks integer default 1,          -- 소급 기간 (1/2/4/8/12주)
  filter_updated_at timestamptz default now(),
  last_crawled_at timestamptz
);
```

#### special_conditions 가능한 값
`유치권`, `지분경매`, `재매각`, `반값물건`, `대항력 있는 임차인`, `위반건축물`, `1년전감정가`, `오늘신건`, `HUG 대항력 포기`, `초보자 경매`

### sent_items 테이블 (발송 이력 — 중복 방지)
```sql
create table sent_items (
  case_number text primary key,
  sent_at timestamptz default now()
);
```

## 환경 변수

### .env.local (프론트엔드)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### GitHub Actions Secrets (크롤러)
```
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
KAKAO_ACCESS_TOKEN=
```

## 카카오톡 알림 메시지 형식

### 1) 첫 메시지 — 요약
```
🏠 경매 알림 — MM월 DD일
이번 주 신규 물건 N건 발견
[지역] | [물건종류]
```

### 2) 물건별 카드 (건당 1개 메시지)
표시 항목:
- 유찰 횟수 태그
- 지역 + 물건 종류 (제목)
- 감정가
- 최저입찰가
- 최저가율 (감정가 대비 %)
- 입찰기일
- 전용면적
- 행크옥션 링크 버튼

카카오 API: 피드형 메시지 (feed)
버튼 타입: web_url → 행크옥션 해당 물건 상세 URL

## 크롤러 핵심 로직

```python
# 조회 시작일 계산
filter = supabase에서 읽기
start_date = filter.filter_updated_at - timedelta(weeks=filter.lookback_weeks)

# 크롤링 → 필터 → 중복 제거 → 발송
items = scrape_hauction(start_date=start_date)
filtered = apply_filters(items, filter)
sent = get_sent_case_numbers()
new_items = [i for i in filtered if i.case_number not in sent]

if new_items:
    send_summary(len(new_items))
    for item in new_items:
        send_item_card(item)
        save_to_sent_items(item.case_number)

update_last_crawled_at()
```

### filter.py 필터 적용 규칙
- `regions`: 빈 배열이면 전국, 값이 있으면 해당 지역만
- `types`: 빈 배열이면 전체, 값이 있으면 해당 종류만
- `appraise_min/max`: null이면 제한 없음 (만원 단위)
- `bid_min/max`: null이면 제한 없음 (만원 단위)
- `special_conditions`: 빈 배열이면 전체, 값이 있으면 해당 태그가 하나라도 붙은 물건만
  ```python
  if filter.special_conditions:
      items = [i for i in items if any(c in i.tags for c in filter.special_conditions)]
  ```

## GitHub Actions 스케줄

```yaml
on:
  schedule:
    - cron: '0 0 * * 1'  # 매주 월요일 00:00 UTC = 09:00 KST
  workflow_dispatch:       # 수동 실행 버튼 (테스트용, 반드시 포함)
```

## 개발 순서

1. Next.js 세팅 — 프로젝트 생성, Supabase 클라이언트 설정
2. 필터 UI — 지역/물건종류 칩, 가격 범위 입력, 토글, 소급 기간
3. API Route — GET(필터 조회) / POST(필터 저장)
4. 크롤러 — scraper.py → filter.py → kakao.py
5. GitHub Actions — workflow yml 작성, Secrets 등록
6. 배포 — Vercel 연결, 환경변수 등록

## 코딩 컨벤션

- TypeScript strict mode 사용
- Tailwind 유틸리티 클래스만 사용 (별도 CSS 파일 금지)
- 컴포넌트는 components/ 에 분리 (src/ 없음)
- Python은 타입 힌트 필수, 함수 단위로 모듈 분리
- 에러 발생 시 카카오톡으로 에러 알림 발송

## 주의사항

- 행크옥션은 공식 API 없음 → requests + BeautifulSoup 크롤링
- JS 렌더링 필요 시 playwright로 전환
- 카카오 액세스 토큰은 30일마다 갱신 필요
  → 만료 7일 전 카카오톡으로 갱신 알림 발송하는 로직 추가할 것
- Supabase filters 테이블은 단일 row만 유지 (upsert 시 id 고정)

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
