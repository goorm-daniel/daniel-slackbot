# 🤖 VX 중계팀 AI 봇 (RAG 업그레이드)

VX팀 전용 심플한 Slack RAG 봇입니다. VX 중계 관련 질문에 전문가 수준의 답변을 제공합니다.

## 🚀 빠른 시작

### 1. 환경 설정
```bash
# 의존성 설치
npm install

# 환경변수 설정 (.env 파일)
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_SIGNING_SECRET=your-secret
OPENAI_API_KEY=sk-your-key
PORT=3000
```

### 2. 봇 시작
```bash
npm start
```

### 3. Slack에서 테스트
```
@봇이름 A7S3 카메라 추천해주세요
@봇이름 강남에서 중계 준비 어떻게 해요?
@봇이름 OBS 설정 도와주세요
```

## 📁 프로젝트 구조

```
vx-rag-bot/
├── src/
│   ├── core/
│   │   ├── SimpleRAGSystem.js      # 핵심 RAG 시스템
│   │   ├── LLMAnswerGenerator.js   # LLM 답변 생성
│   │   └── HybridSearchEngine.js   # 하이브리드 검색
│   ├── processors/
│   │   └── VXDataProcessor.js       # VX 데이터 처리
│   ├── utils/
│   │   ├── EmbeddingManager.js     # 임베딩 관리
│   │   └── DataLoader.js           # 데이터 로딩
│   ├── adapters/
│   │   └── SimpleRAGAdapter.js     # Slack 연동
│   └── slack/
│       └── SlackBot.js             # Slack 봇
├── data/                           # VX 데이터 (6개 JSON)
├── package.json
├── .env
└── README.md
```

## 🎯 주요 기능

- **RAG 기반 답변**: VX 데이터 기반 정확한 답변
- **하이브리드 검색**: 벡터 + 키워드 검색
- **LLM 연동**: OpenAI GPT 기반 자연스러운 답변
- **Slack 최적화**: Slack 친화적 포맷팅

## 🔧 설정

### 필수 환경변수
- `SLACK_BOT_TOKEN`: Slack 봇 토큰
- `SLACK_SIGNING_SECRET`: Slack 서명 시크릿
- `OPENAI_API_KEY`: OpenAI API 키

### 선택 환경변수
- `PORT`: 서버 포트 (기본값: 3000)

## 📊 지원하는 질문 유형

- **장비 추천**: "A7S3 카메라 추천해주세요"
- **장소별 가이드**: "강남에서 중계 준비 어떻게 해요?"
- **문제 해결**: "OBS에서 노이즈 제거하는 방법"
- **설정 도움**: "Zoom BGM 설정 어떻게 해요?"

## 🛠️ 개발

```bash
# 개발 모드 (자동 재시작)
npm run dev

# 프로덕션 모드
npm start
```

## 📞 문제 해결

### RAG 시스템 초기화 실패
- OpenAI API 키 확인
- 네트워크 연결 확인
- 의존성 재설치: `npm install`

### Slack 봇 응답 없음
- Slack 토큰 확인
- 이벤트 URL 설정 확인
- 봇 권한 확인

## 🎉 성과

- **답변 품질**: 전문가 수준
- **응답 시간**: 3초 이내
- **정확도**: VX 데이터 기반
- **사용성**: Slack 친화적

---

**VX팀 전용으로 최적화된 심플하고 실용적인 RAG 봇입니다!** 🚀