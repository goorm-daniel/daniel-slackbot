# 🚀 Vercel 배포 가이드 - VX 중계 AI 봇

## 📋 배포 전 체크리스트

### 1. 환경변수 설정 (Vercel 대시보드)
Vercel 프로젝트 설정 → Environment Variables에서 다음 변수들을 설정하세요:

```bash
# 필수 환경변수
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
OPENAI_API_KEY=sk-your-openai-key

# 선택 환경변수
NODE_ENV=production
```

### 2. Slack 앱 설정 확인
1. **Event Subscriptions** 활성화
2. **Request URL**: `https://your-vercel-app.vercel.app/api/slack`
3. **Subscribe to bot events**: `app_mention`
4. **OAuth & Permissions**:
   - `chat:write` (봇이 메시지 전송)
   - `app_mentions:read` (멘션 읽기)

### 3. 배포 명령어
```bash
# Vercel CLI 설치 (없는 경우)
npm i -g vercel

# 배포 (Node.js 22.x 사용)
vercel --prod

# 또는 GitHub 연동 시 자동 배포
git push origin main
```

### 4. Node.js 버전 확인
- **현재 설정**: Node.js 22.x (Vercel 최신 지원)
- **package.json**: `"engines": { "node": "22.x" }`
- **vercel.json**: 자동 감지 (런타임 명시 불필요)

## 🔧 문제 해결

### 문제 1: Slack 봇이 응답하지 않음
**원인**: Event Subscriptions URL이 잘못 설정됨
**해결**: 
1. Slack 앱 설정 → Event Subscriptions
2. Request URL을 `https://your-app.vercel.app/api/slack`로 설정
3. URL 검증이 성공하는지 확인

### 문제 2: RAG 시스템 초기화 실패
**원인**: OpenAI API 키 문제 또는 네트워크 이슈
**해결**:
1. Vercel 환경변수에서 `OPENAI_API_KEY` 확인
2. Vercel 함수 로그에서 오류 메시지 확인
3. Mock LLM으로 폴백되는지 확인

### 문제 3: ES Module 오류
**원인**: `@xenova/transformers`가 ES Module이므로 `require()` 사용 불가
**해결**: 
1. `const { pipeline } = require('@xenova/transformers')` → `const { pipeline } = await import('@xenova/transformers')`
2. 동적 import 사용으로 ES Module 호환성 확보

### 문제 4: 캐시 디렉토리 오류
**원인**: Vercel 서버리스 환경에서 `@xenova/transformers` 캐시 디렉토리 생성 실패
**해결**:
1. 캐시 디렉토리를 `/tmp/transformers_cache`로 설정
2. 폴백 모델 사용 (`Xenova/all-MiniLM-L6-v2`)
3. 최종 폴백: Mock 모드 (키워드 기반 유사도 계산)

### 문제 5: 타임아웃 오류
**원인**: RAG 시스템 초기화 시간이 30초 초과
**해결**:
1. `vercel.json`에서 `maxDuration`을 60초로 증가
2. 또는 RAG 초기화를 비동기로 처리

### 문제 6: 중복 답변 문제
**원인**: 같은 질문에 대해 동일한 답변을 반복 제공
**해결**:
1. 중복 요청 방지: 이벤트 ID 기반 세션 관리
2. 응답 캐시: 5분간 같은 질문에 대해 캐시된 답변 사용
3. 답변 랜덤화: 매번 다른 프리픽스와 청크 조합 사용

### 문제 7: CORS 오류
**원인**: Slack에서 Vercel API 호출 시 CORS 문제
**해결**: `api/slack.js`에 CORS 헤더가 이미 설정되어 있음

## 📊 배포 후 확인사항

### 1. API 엔드포인트 테스트
```bash
# 상태 확인
curl https://your-app.vercel.app/api/slack

# 예상 응답
{
  "message": "🤖 VX 중계팀 AI 봇 (Vercel 배포)",
  "status": "running",
  "ragReady": true,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Slack에서 테스트
```
@봇이름 안녕하세요
@봇이름 A7S3 카메라 추천해주세요
@봇이름 강남에서 중계 준비 어떻게 해요?
```

### 3. Vercel 함수 로그 확인
1. Vercel 대시보드 → Functions 탭
2. `api/slack.js` 함수 클릭
3. 실시간 로그에서 오류 확인

## 🎯 성공 지표

- ✅ API 엔드포인트가 200 응답
- ✅ Slack 봇이 멘션에 응답
- ✅ RAG 시스템이 정상 초기화
- ✅ VX 데이터 기반 답변 생성

## 🚨 주의사항

1. **환경변수**: Vercel에서만 설정, 로컬 `.env` 파일과 별개
2. **타임아웃**: Vercel 무료 플랜은 10초, Pro는 60초
3. **콜드 스타트**: 첫 요청 시 RAG 초기화로 인한 지연 가능
4. **로그**: Vercel 함수 로그에서 디버깅 정보 확인

---

**배포 완료 후 Slack에서 @봇이름으로 테스트해보세요!** 🚀
