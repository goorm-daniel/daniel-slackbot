# 🤖 구름 중계팀 AI 슬랙봇

중계 가이드북 내용을 학습한 AI 슬랙봇으로, 팀원들이 중계 관련 질문을 할 수 있습니다.

## 📋 프로젝트 개요

- **목표**: 중계 가이드북 기반 질의응답 시스템
- **기술**: Node.js + OpenAI API + RAG 패턴 + Slack Bolt
- **데이터**: 6개 JSON 파일로 구조화된 중계 가이드
- **배포**: Vercel 서버리스 함수로 배포

## 🗂️ 프로젝트 구조

```
daniel_bot/
├── data/                          # 중계 가이드 데이터
│   ├── platforms.json            # 중계 플랫폼 비교
│   ├── equipment.json            # 장비 사용법
│   ├── obs_guide.json           # OBS 스튜디오 가이드
│   ├── locations.json           # 공간별 세팅 (판교, 카카오테크, 강남)
│   ├── zoom_guide.json          # ZOOM 세팅
│   └── checklists_and_faq.json  # 체크리스트 및 FAQ
├── src/
│   ├── chatbot-logic.js         # 핵심 봇 로직
│   ├── slack-app.js             # Slack 앱 서버
│   └── test.js                  # 콘솔 테스트
├── api/
│   └── slack.js                 # Vercel 서버리스 함수
├── package.json
├── vercel.json                  # Vercel 설정
├── README.md
├── DEPLOYMENT.md               # 배포 가이드
└── SLACK_SETUP.md              # Slack 앱 설정 가이드
```

## 🚀 시작하기

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경변수 설정
`.env` 파일을 생성하고 필요한 API 키들을 설정하세요:
```bash
# .env 파일
OPENAI_API_KEY=your_openai_api_key_here
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_SIGNING_SECRET=your_slack_signing_secret
```

### 3. 테스트 실행
```bash
# 콘솔 테스트
npm run test
# 또는
node src/test.js

# 로컬 Slack 서버 실행
npm start
# 또는
npm run dev
```

## 🤖 봇 기능

### 문제해결 모드
- "맥북으로 연결하는데 화면이 안나와요"
- "OBS에서 화면이 검은색으로 나와요"
- "마이크 소리가 안들려요"

### 가이드 제공 모드
- "판교에서 중계 준비 어떻게 해요?"
- "OBS 스튜디오 설정 방법 알려주세요"
- "줌으로 라이브 스트리밍 하는 방법은?"
- "강남 교육장에서 맥북 연결 문제 해결해주세요"
- "카카오테크 부트캠프 세팅 방법 알려주세요"

## 📊 데이터 구조

### platforms.json
중계 플랫폼별 설정 및 문제해결 가이드

### equipment.json
캡처보드, PTZ카메라, 맥북 연결 등 장비 사용법

### obs_guide.json
OBS 스튜디오 완전 사용법

### locations.json
판교, 카카오테크, 강남 등 공간별 세팅 가이드
- **구름스퀘어 판교**: 빔프로젝터 연결, 온오프라인 동시 중계
- **카카오테크 부트캠프**: 단상 노트북 세팅, 카메라 세팅, 오디오 세팅
- **구름스퀘어 강남**: 13층 교육장, 14층 타운홀, PTZ 카메라 사용법

### zoom_guide.json
ZOOM 세팅 및 문제해결

### checklists_and_faq.json
체크리스트 및 자주 묻는 질문
- **중계준비체크리스트**: 공통 기본 준비사항, 온라인 중계 시 추가사항
- **자주묻는질문FAQ**: 연결 관련, OBS 관련, 화면 관련 문제 해결
- **노트북연결시화면인식문제**: 맥북, 그램, 서피스 주사율 조정 방법
- **강남교육장맥북연결문제**: 단계별 체크리스트 및 해결방법
- **사운드연결문제**: 노트북 사운드 세팅 체크리스트

## 🔧 개발자 가이드

### 핵심 로직 (chatbot-logic.js)
- 질문 분석: 키워드 기반으로 문제해결/가이드 구분
- 데이터 검색: 관련 JSON 데이터 찾기
- ChatGPT 연동: RAG 패턴으로 맞춤 답변 생성

### Slack 앱 (slack-app.js)
- Slack Bolt 프레임워크 사용
- 멘션 이벤트 처리
- 실시간 질의응답

### Vercel 서버리스 함수 (api/slack.js)
- 서버리스 환경에서 Slack 이벤트 처리
- 자동 스케일링 및 글로벌 배포

### 테스트 (test.js)
- 콘솔에서 직접 질문하고 답변 받기
- 샘플 질문 제공
- 봇 상태 확인

## 📝 사용 예시

```bash
$ npm run test

🤖 구름 중계팀 AI 슬랙봇 테스트 모드
==================================================
🔑 OpenAI API 키를 입력해주세요:
API 키: sk-...

✅ 봇이 준비되었습니다! 질문을 입력해보세요.

❓ 질문을 입력하세요: 맥북으로 연결하는데 화면이 안나와요

⏳ 답변을 생성하고 있습니다...

🤖 중계봇 답변:
──────────────────────────────────────────────────
맥북 화면 연결 문제를 해결해드릴게요! 🖥️

먼저 몇 가지 확인해보겠습니다:

1️⃣ USB-C to HDMI 어댑터가 제대로 연결되어 있나요?
2️⃣ 주사율을 30Hz로 설정해보셨나요?
3️⃣ 시스템 환경설정 > 디스플레이에서 외부 모니터가 감지되는지 확인해보세요
4️⃣ 캡처보드에서 맥북 신호를 인식하고 있는지 확인해보세요

🔍 분석 정보: troubleshooting (키워드: 맥북, 화면, 안나와)
```

## 🚀 배포 및 사용

### Vercel 배포
```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel

# 환경변수 설정
vercel env add OPENAI_API_KEY
vercel env add SLACK_BOT_TOKEN
vercel env add SLACK_SIGNING_SECRET
```

### Slack에서 사용
```
@구름중계봇 [질문]
```

자세한 배포 가이드는 [DEPLOYMENT.md](./DEPLOYMENT.md)를 참고하세요.
Slack 앱 설정은 [SLACK_SETUP.md](./SLACK_SETUP.md)를 참고하세요.

## 📞 문의

구름 중계팀에 문의하세요!
