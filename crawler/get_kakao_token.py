"""
카카오 액세스/리프레시 토큰 최초 발급 스크립트
한 번만 실행하면 돼.
"""
import os
import webbrowser
import requests
from dotenv import load_dotenv

load_dotenv()

REST_API_KEY = os.environ["KAKAO_REST_API_KEY"]
CLIENT_SECRET = os.environ.get("KAKAO_CLIENT_SECRET", "")
REDIRECT_URI = "https://localhost"

auth_url = (
    f"https://kauth.kakao.com/oauth/authorize"
    f"?client_id={REST_API_KEY}"
    f"&redirect_uri={REDIRECT_URI}"
    f"&response_type=code"
    f"&scope=talk_message"
)

print("브라우저가 열립니다. 카카오 로그인 후 리다이렉트된 URL을 복사하세요.")
print(f"\n직접 열기: {auth_url}\n")
webbrowser.open(auth_url)

redirected_url = input("리다이렉트된 URL 전체를 붙여넣으세요: ").strip()

# URL에서 code 파라미터 추출
if "code=" not in redirected_url:
    print("URL에 code가 없습니다. 다시 시도하세요.")
    exit(1)

code = redirected_url.split("code=")[1].split("&")[0]

data = {
    "grant_type": "authorization_code",
    "client_id": REST_API_KEY,
    "redirect_uri": REDIRECT_URI,
    "code": code,
}
if CLIENT_SECRET:
    data["client_secret"] = CLIENT_SECRET

res = requests.post("https://kauth.kakao.com/oauth/token", data=data)

data = res.json()

if "access_token" not in data:
    print(f"에러: {data}")
    exit(1)

print("\n===== 발급 완료 =====")
print(f"액세스 토큰:  {data['access_token']}")
print(f"리프레시 토큰: {data['refresh_token']}")
print("\nGitHub Secrets에 아래 두 값을 등록하세요:")
print(f"  KAKAO_REFRESH_TOKEN = {data['refresh_token']}")
