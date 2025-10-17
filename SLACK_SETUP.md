# 🔧 Slack 앱 설정 가이드

## 📋 **Slack 앱 권한 설정 체크리스트**

### **1. Bot Token Scopes (필수 권한)**
Slack 앱 설정 → OAuth & Permissions → Scopes에서 다음 권한들을 추가해야 합니다:

#### **필수 권한:**
- ✅ `app_mentions:read` - 멘션 이벤트 수신
- ✅ `chat:write` - 메시지 전송
- ✅ `channels:read` - 채널 정보 읽기
- ✅ `groups:read` - 그룹 정보 읽기
- ✅ `im:read` - DM 정보 읽기
- ✅ `mpim:read` - 멀티파티 DM 읽기

#### **권한 설정 방법:**
1. [api.slack.com/apps](https://api.slack.com/apps) 접속
2. 앱 선택 → "OAuth & Permissions"
3. "Scopes" 섹션에서 "Bot Token Scopes" 추가
4. 위 권한들을 모두 추가
5. "Install to Workspace" 클릭하여 권한 재설치

### **2. Event Subscriptions 설정**

#### **Request URL:**
```
https://your-app.vercel.app/slack/events
```

#### **Subscribe to bot events:**
- ✅ `app_mention` - 봇 멘션 이벤트

#### **설정 방법:**
1. Slack 앱 설정 → "Event Subscriptions"
2. "Enable Events" 활성화
3. Request URL 입력 후 "Verified ✓" 확인
4. "Subscribe to bot events"에 `app_mention` 추가
5. "Save Changes" 클릭

### **3. 환경변수 설정 (Vercel)**

Vercel 대시보드에서 다음 환경변수들을 설정:

```
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_SIGNING_SECRET=your-signing-secret-here
OPENAI_API_KEY=your-openai-api-key-here
```

#### **토큰 찾는 방법:**
1. **Bot Token**: OAuth & Permissions → "Bot User OAuth Token"
2. **Signing Secret**: Basic Information → "Signing Secret"

### **4. 테스트 방법**

#### **권한 테스트:**
1. Slack 채널에서 `@봇이름` 멘션
2. 봇이 응답하는지 확인
3. Vercel 로그에서 이벤트 수신 확인

#### **문제 해결:**
- **멘션은 되지만 응답 없음**: Bot Token Scopes 확인
- **URL 검증 실패**: Request URL 정확성 확인
- **401 Unauthorized**: Signing Secret 확인

### **5. 일반적인 문제들**

#### **문제 1: "Your request URL responded with an HTTP error"**
**해결방법:**
- Vercel 배포 완료 후 URL 사용
- URL 검증 로직 확인
- 환경변수 설정 확인

#### **문제 2: 멘션은 되지만 답장 없음**
**해결방법:**
- Bot Token Scopes에 `chat:write` 권한 추가
- Workspace에 앱 재설치
- Vercel 로그 확인

#### **문제 3: "Missing authentication"**
**해결방법:**
- Bot Token과 Signing Secret 정확성 확인
- 환경변수 이름 대소문자 확인
- Vercel에서 환경변수 재설정

### **6. 디버깅 팁**

#### **Vercel 로그 확인:**
```bash
vercel logs
```

#### **로컬 테스트:**
```bash
npm run vercel-dev
```

#### **권한 확인:**
Slack 앱 설정에서 "OAuth & Permissions" → "Scopes" 확인

---

## 🎯 **체크리스트 요약**

- [ ] Bot Token Scopes 설정 완료
- [ ] Event Subscriptions 설정 완료
- [ ] Request URL 검증 완료 ("Verified ✓")
- [ ] 환경변수 설정 완료
- [ ] Workspace에 앱 설치 완료
- [ ] 테스트 멘션 성공

**모든 항목을 체크하면 Slack 봇이 정상 작동합니다!** 🚀
