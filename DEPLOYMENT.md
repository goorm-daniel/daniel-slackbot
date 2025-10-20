# 🚀 Vercel + Slack 봇 배포 가이드

## 📋 배포 체크리스트

### 1. ✅ 파일 준비 완료
- `vercel.json` - Vercel 서버리스 함수 설정
- `api/slack.js` - Vercel 서버리스 함수 (Slack 이벤트 처리)
- `src/slack-app.js` - 로컬 테스트용 서버
- `src/chatbot-logic.js` - 핵심 봇 로직
- `data/` - 중계 가이드 데이터 (6개 JSON 파일)
- `package.json` - 의존성 업데이트 완료

### 2. 🔑 환경변수 설정

#### **로컬 개발용 (.env 파일)**
```bash
# .env 파일에 추가
OPENAI_API_KEY=your_openai_api_key_here
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_SIGNING_SECRET=your_slack_signing_secret
```

#### **Vercel 배포용**
```bash
# Vercel CLI로 환경변수 설정
vercel env add OPENAI_API_KEY
vercel env add SLACK_BOT_TOKEN
vercel env add SLACK_SIGNING_SECRET
```

### 3. 🔧 Slack 앱 설정

#### **Slack App 생성**
1. [api.slack.com/apps](https://api.slack.com/apps) 접속
2. "Create New App" → "From scratch"
3. App Name: "구름 중계팀 AI 챗봇"
4. Workspace 선택
5. **중요**: 앱 생성 후 Basic Information에서 Signing Secret 복사

#### **Bot Token 설정**
1. "OAuth & Permissions" → "Scopes"
2. Bot Token Scopes 추가:
   - `app_mentions:read`
   - `chat:write`
   - `channels:read`
   - `groups:read`
   - `im:read`
   - `mpim:read`

#### **Event Subscriptions 설정**
1. "Event Subscriptions" 활성화
2. Request URL: `https://your-vercel-app.vercel.app/slack/events`
3. Subscribe to bot events:
   - `app_mention`

#### **App Home 설정**
1. "App Home" → "Show Tabs" 활성화
2. "Allow users to send Slash commands and messages" 활성화

### 4. 🚀 Vercel 배포

#### **Vercel CLI 설치 및 배포**
```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 배포
vercel

# 환경변수 설정
vercel env add OPENAI_API_KEY
vercel env add SLACK_BOT_TOKEN
vercel env add SLACK_SIGNING_SECRET

# 프로덕션 배포
vercel --prod
```

#### **GitHub 연동 배포 (권장)**
1. GitHub에 코드 푸시
2. [vercel.com](https://vercel.com)에서 GitHub 연동
3. 프로젝트 import
4. 환경변수 설정

### 5. 🧪 테스트

#### **로컬 테스트**
```bash
# 서버 실행
npm start

# Vercel 로컬 개발 서버
npm run vercel-dev

# 테스트
curl http://localhost:3000/slack/events
```

#### **배포 후 테스트**
```bash
# Slack 이벤트 엔드포인트 테스트
curl -X POST https://your-vercel-app.vercel.app/slack/events

# Vercel 함수 로그 확인
vercel logs
```

#### **Slack 테스트**
```
@구름중계봇 맥북 화면이 안나와요
@구름중계봇 OBS 설정 어떻게 해요?
@구름중계봇 판교에서 중계 준비는?
@구름중계봇 강남 교육장에서 맥북 연결 문제 해결해주세요
@구름중계봇 카카오테크 부트캠프 세팅 방법 알려주세요
```

## 📊 엔드포인트

- **Slack 이벤트**: `/slack/events` - Slack 이벤트 수신 (Vercel 서버리스 함수)
- **로컬 개발**: `http://localhost:3000` - 로컬 Slack 앱 서버

## 🔍 문제 해결

### **일반적인 문제들**

1. **Slack 이벤트 수신 안됨**
   - Request URL이 정확한지 확인
   - Signing Secret이 올바른지 확인
   - Bot Token 권한 확인

2. **OpenAI API 오류**
   - API 키가 유효한지 확인
   - API 사용량 한도 확인

3. **Vercel 배포 실패**
   - 환경변수 설정 확인
   - Node.js 버전 호환성 확인

### **로그 확인**
```bash
# Vercel 로그 확인
vercel logs

# 로컬 로그 확인
npm start
```

## 🎯 사용법

### **슬랙에서 사용**
```
@구름중계봇 [질문]
```

### **예시 질문들**
- 맥북으로 연결하는데 화면이 안나와요
- OBS에서 화면이 검은색으로 나와요
- 마이크 소리가 안들려요
- 판교에서 중계 준비 어떻게 해요?
- OBS 스튜디오 설정 방법 알려주세요
- 줌으로 라이브 스트리밍 하는 방법은?
- 인터넷이 느려서 화질이 떨어져요
- 캡처보드가 인식이 안돼요
- 강남 교육장에서 맥북 연결 문제 해결해주세요
- 카카오테크 부트캠프 세팅 방법 알려주세요
- PTZ 카메라 사용법 알려주세요
- 사운드 믹서 설정 방법은?

## 📝 추가 기능

### **Vercel 서버리스 함수**
- 자동 스케일링
- 서버 관리 불필요
- 글로벌 CDN 배포

### **로컬 개발 환경**
- nodemon을 통한 자동 재시작
- 실시간 개발 및 테스트
- 디버깅 지원

### **데이터 구조**
- **6개 JSON 파일**: 중계 가이드 데이터
- **RAG 패턴**: 질문 분석 → 데이터 검색 → ChatGPT 답변 생성
- **공간별 가이드**: 판교, 카카오테크, 강남 교육장별 세팅 방법
- **문제해결 가이드**: 맥북 연결, OBS 설정, 사운드 문제 등

---

🎉 **배포 완료 후 구름 중계팀에서 편리하게 사용하세요!**
