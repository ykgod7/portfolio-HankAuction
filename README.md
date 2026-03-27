# 행크옥션 경매 알림 서비스

행크옥션(hauction.co.kr)에서 조건에 맞는 경매 물건을 자동으로 찾아 카카오톡으로 알려주는 서비스.

## 어떻게 동작하나

1. 매주 월요일 09:00 KST, GitHub Actions가 자동으로 크롤러를 실행
2. 행크옥션에서 경매 목록을 긁어옴 (Playwright 헤드리스 브라우저)
3. Supabase에 저장된 필터 조건(지역, 물건종류, 가격대 등)으로 필터링
4. 이전에 알림 보낸 물건은 제외하고, 새 물건만 카카오톡으로 발송
5. 새 물건이 없으면 "없음" 알림 발송

## 구성

| 구성 요소 | 역할 |
|----------|------|
| Next.js 웹사이트 | 필터 설정 화면 (지역, 물건종류, 가격대, 특수조건) |
| Python 크롤러 | 행크옥션 크롤링 + 카카오톡 발송 |
| Supabase | 필터 설정 저장, 발송 이력 관리 |
| GitHub Actions | 매주 자동 실행 스케줄러 |
| Vercel | 웹사이트 배포 |

## 주요 기술

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend/DB**: Supabase (PostgreSQL)
- **Crawler**: Python 3.11, Playwright
- **알림**: 카카오 나에게 보내기 API

## 로컬 실행

### 프론트엔드
```bash
npm install
npm run dev
```

### 크롤러
```bash
cd crawler
source venv/Scripts/activate  # Windows
pip install -r requirements.txt
playwright install chromium

python main.py --dry-run  # 실제 발송 없이 결과만 출력
python main.py            # 실제 실행
```

## 환경 변수

### 프론트엔드 (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### 크롤러 (`crawler/.env`)
```
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
KAKAO_REST_API_KEY=
KAKAO_CLIENT_SECRET=
KAKAO_REFRESH_TOKEN=
```

## 카카오 토큰 최초 발급

카카오 리프레시 토큰은 최초 1회만 발급받으면 이후 자동 갱신된다.

```bash
cd crawler
python get_kakao_token.py
```

발급된 `KAKAO_REFRESH_TOKEN`을 GitHub Secrets에 등록.
