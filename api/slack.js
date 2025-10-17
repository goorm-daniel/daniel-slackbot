const { WebClient } = require('@slack/web-api');
const crypto = require('crypto');

// 환경변수 확인
if (!process.env.SLACK_BOT_TOKEN) {
  console.error('❌ SLACK_BOT_TOKEN이 설정되지 않았습니다');
}

if (!process.env.SLACK_SIGNING_SECRET) {
  console.error('❌ SLACK_SIGNING_SECRET이 설정되지 않았습니다');
}

// 슬랙 웹 클라이언트 초기화
const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
const signingSecret = process.env.SLACK_SIGNING_SECRET;

// 챗봇 인스턴스는 함수 내에서 초기화 (메모리 최적화)
let chatbot = null;

// 슬랙 요청 서명 검증 함수 (Vercel 서버리스 환경용)
function verifySlackRequest(signingSecret, body, headers) {
  const signature = headers['x-slack-signature'];
  const timestamp = headers['x-slack-request-timestamp'];
  
  if (!signature || !timestamp) {
    console.log('❌ 서명 또는 타임스탬프가 없음');
    return false;
  }
  
  // 타임스탬프가 5분 이상 지났는지 확인
  const time = Math.floor(new Date().getTime() / 1000);
  if (Math.abs(time - timestamp) > 300) {
    console.log('❌ 타임스탬프가 너무 오래됨:', Math.abs(time - timestamp), '초');
    return false;
  }
  
  // 서명 검증
  const sigBaseString = 'v0:' + timestamp + ':' + body;
  const mySignature = 'v0=' + crypto
    .createHmac('sha256', signingSecret)
    .update(sigBaseString, 'utf8')
    .digest('hex');
  
  console.log('🔍 서명 검증 디버그:', {
    expectedSignature: mySignature,
    receivedSignature: signature,
    bodyLength: body.length,
    timestamp: timestamp
  });
  
  return crypto.timingSafeEqual(
    Buffer.from(mySignature, 'utf8'),
    Buffer.from(signature, 'utf8')
  );
}

module.exports = async (req, res) => {
  try {
    console.log('🚀 Vercel 서버리스 함수 시작');
    console.log('📥 요청 메서드:', req.method);
    console.log('📥 요청 URL:', req.url);
    
    // 챗봇 인스턴스 지연 초기화
    if (!chatbot) {
      try {
        const BroadcastChatbot = require('../src/chatbot-logic');
        chatbot = new BroadcastChatbot();
        console.log('✅ 챗봇 인스턴스 초기화 완료');
      } catch (chatbotError) {
        console.error('❌ 챗봇 초기화 실패:', chatbotError);
        return res.status(500).json({ error: 'Chatbot initialization failed' });
      }
    }
    
    // 환경변수 재확인
    if (!process.env.SLACK_BOT_TOKEN) {
      console.error('❌ SLACK_BOT_TOKEN이 설정되지 않았습니다');
      return res.status(500).json({ error: 'Bot token not configured' });
    }
    
    if (!process.env.SLACK_SIGNING_SECRET) {
      console.error('❌ SLACK_SIGNING_SECRET이 설정되지 않았습니다');
      return res.status(500).json({ error: 'Signing secret not configured' });
    }
    
    // 1. URL 검증 처리
    if (req.body && req.body.type === 'url_verification') {
      console.log('🔐 URL 검증 요청');
      const challenge = req.body.challenge;
      
      if (!challenge) {
        console.error('❌ challenge 값이 없습니다');
        return res.status(400).json({ error: 'Missing challenge' });
      }
      
      res.setHeader('Content-Type', 'text/plain');
      res.status(200).send(challenge);
      console.log('✅ URL 검증 완료:', challenge);
      return;
    }
    
    // 2. 슬랙 서명 검증 (Vercel 서버리스 환경용)
    console.log('🔍 요청 헤더 정보:', {
      signature: req.headers['x-slack-signature'] ? '있음' : '없음',
      timestamp: req.headers['x-slack-request-timestamp'] ? '있음' : '없음',
      contentType: req.headers['content-type'],
      userAgent: req.headers['user-agent']
    });
    
    console.log('🔑 환경변수 확인:', {
      hasSigningSecret: !!process.env.SLACK_SIGNING_SECRET,
      nodeEnv: process.env.NODE_ENV
    });
    
    // Vercel에서 rawBody 처리
    let rawBody;
    if (req.rawBody) {
      rawBody = req.rawBody;
    } else {
      // req.body가 이미 파싱된 경우 JSON.stringify로 복원
      rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }
    
    console.log('📦 Body 정보:', {
      bodyType: typeof req.body,
      rawBodyType: typeof rawBody,
      bodyLength: rawBody.length
    });
    
    // 프로덕션 환경에서 서명 검증
    if (process.env.NODE_ENV === 'production') {
      if (!verifySlackRequest(process.env.SLACK_SIGNING_SECRET, rawBody, req.headers)) {
        console.error('❌ 슬랙 서명 검증 실패');
        return res.status(401).send('Unauthorized');
      }
      console.log('✅ 슬랙 서명 검증 성공');
    } else {
      console.log('🔧 개발 환경 - 서명 검증 스킵');
    }
    
    // 3. 이벤트 콜백 처리
    if (req.body.type === 'event_callback') {
      const event = req.body.event;
      console.log('📨 이벤트 타입:', event.type);
      console.log('📋 이벤트 상세:', JSON.stringify(event, null, 2));
      
      // app_mention 이벤트 처리
      if (event.type === 'app_mention') {
        console.log('📢 멘션 메시지:', event.text);
        console.log('📢 채널:', event.channel);
        console.log('📢 사용자:', event.user);
        
        // 봇 자신의 메시지는 무시
        if (event.bot_id) {
          console.log('🤖 봇 메시지 무시');
          return res.status(200).send('OK');
        }
        
        try {
          // 멘션 제거하고 질문만 추출
          const question = event.text.replace(/<@[^>]+>/g, '').trim();
          console.log('❓ 추출된 질문:', question);
          
          if (!question) {
            await slack.chat.postMessage({
              channel: event.channel,
              text: '안녕하세요! 중계 관련 질문을 해주세요 🎥\n\n예시:\n• 맥북 화면이 안나와요\n• OBS 설정 어떻게 해요?\n• 판교에서 중계 준비는?',
              thread_ts: event.ts
            });
            console.log('✅ 안내 메시지 전송');
            return res.status(200).send('OK');
          }
          
          // 챗봇 로직 실행
          console.log('🤖 챗봇 처리 시작...');
          const result = await chatbot.processQuestion(question);
          console.log('🤖 챗봇 결과:', result);
          
          if (result && result.success) {
            console.log('💬 생성된 답변 길이:', result.response.length);
            
            // 슬랙에 답변 전송
            await slack.chat.postMessage({
              channel: event.channel,
              text: result.response,
              thread_ts: event.ts
            });
            
            console.log('✅ 답변 전송 완료');
          } else {
            console.log('❌ 답변 생성 실패:', result?.error || 'Unknown error');
            
            // 실패 시 사용자에게 안내
            await slack.chat.postMessage({
              channel: event.channel,
              text: '😅 죄송합니다. 답변 생성 중 문제가 발생했습니다. 다시 시도해주세요.',
              thread_ts: event.ts
            });
          }
          
        } catch (chatbotError) {
          console.error('❌ 챗봇 처리 오류:', chatbotError);
          console.error('❌ 에러 스택:', chatbotError.stack);
          
          // 오류 시 사용자에게 안내
          try {
            await slack.chat.postMessage({
              channel: event.channel,
              text: '😅 죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
              thread_ts: event.ts
            });
            console.log('✅ 에러 복구 메시지 전송');
          } catch (slackError) {
            console.error('❌ 슬랙 메시지 전송 실패:', slackError);
          }
        }
      }
    }
    
    // 성공 응답
    res.status(200).send('OK');
    
  } catch (error) {
    console.error('❌ 서버 에러:', error);
    console.error('❌ 에러 스택:', error.stack);
    console.error('❌ 에러 타입:', error.constructor.name);
    
    // 응답이 이미 전송되지 않았을 때만 에러 응답
    if (!res.headersSent) {
      try {
        res.status(500).json({ 
          error: 'Internal server error',
          message: error.message,
          type: error.constructor.name
        });
      } catch (responseError) {
        console.error('❌ 응답 전송 실패:', responseError);
      }
    } else {
      console.log('⚠️ 응답이 이미 전송됨, 에러 응답 스킵');
    }
  }
};