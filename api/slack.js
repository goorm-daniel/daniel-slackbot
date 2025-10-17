const { App } = require('@slack/bolt');
const BroadcastChatbot = require('../src/chatbot-logic');

// 슬랙 앱 초기화
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  processBeforeResponse: true
});

// 챗봇 인스턴스 생성
const chatbot = new BroadcastChatbot();

// 멘션 이벤트 핸들러
app.event('app_mention', async ({ event, client }) => {
  try {
    console.log('📢 멘션 받음:', event.text);
    
    const question = event.text.replace(/<@[^>]+>/g, '').trim();
    
    if (!question) {
      await client.chat.postMessage({
        channel: event.channel,
        text: '안녕하세요! 중계 관련 질문을 해주세요 🎥\n\n예시:\n• 맥북 화면이 안나와요\n• OBS 설정 어떻게 해요?\n• 판교에서 중계 준비는?',
        thread_ts: event.ts
      });
      return;
    }
    
    console.log('🤖 챗봇 답변 생성 중...');
    const result = await chatbot.processQuestion(question);
    
    if (result.success) {
      await client.chat.postMessage({
        channel: event.channel,
        text: result.response,
        thread_ts: event.ts
      });
      console.log('✅ 답변 전송 완료');
    } else {
      await client.chat.postMessage({
        channel: event.channel,
        text: '😅 죄송합니다. 답변 생성 중 문제가 발생했습니다. 다시 시도해주세요.',
        thread_ts: event.ts
      });
      console.log('❌ 답변 생성 실패:', result.error);
    }
    
  } catch (error) {
    console.error('❌ 슬랙봇 오류:', error);
    
    try {
      await client.chat.postMessage({
        channel: event.channel,
        text: '😅 죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        thread_ts: event.ts
      });
    } catch (slackError) {
      console.error('❌ 슬랙 메시지 전송 실패:', slackError);
    }
  }
});

// 에러 처리
app.error((error) => {
  console.error('❌ 슬랙 앱 에러:', error);
});

// Vercel 서버리스 함수 핸들러
module.exports = async (req, res) => {
  try {
    console.log('🚀 요청 받음:', req.method);
    console.log('📥 요청 바디:', JSON.stringify(req.body, null, 2));
    
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // OPTIONS 요청 처리
    if (req.method === 'OPTIONS') {
      console.log('🔧 CORS preflight 요청 처리');
      res.status(200).end();
      return;
    }
    
    // POST 요청만 처리
    if (req.method !== 'POST') {
      console.log('❌ POST 요청이 아님:', req.method);
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }
    
    // 개발 환경에서만 상세 로깅
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔧 개발 모드 - 상세 정보:');
      console.log('  Headers:', req.headers);
      console.log('  Method:', req.method);
      console.log('  URL:', req.url);
    }
    
    // 1. URL 검증 처리 (최우선)
    if (req.body && req.body.type === 'url_verification') {
      console.log('🔐 URL 검증 요청 감지');
      
      const challenge = req.body.challenge;
      
      if (!challenge) {
        console.error('❌ challenge 값이 없습니다');
        return res.status(400).json({ error: 'Missing challenge' });
      }
      
      console.log('🔑 Challenge 값:', challenge);
      
      try {
        // plaintext로 응답
        res.setHeader('Content-Type', 'text/plain');
        res.status(200).send(challenge);
        
        console.log('✅ URL 검증 응답 완료');
        return;
      } catch (verificationError) {
        console.error('❌ URL 검증 실패:', verificationError);
        return res.status(500).json({ error: 'URL verification failed' });
      }
    }
    
    // 2. 슬랙 이벤트 타입 확인 및 로깅
    if (req.body && req.body.event) {
      console.log('📋 슬랙 이벤트 타입:', req.body.event.type);
    }
    
    // 3. 일반 슬랙 이벤트 처리
    console.log('📨 일반 슬랙 이벤트 처리 시작');
    await app.receiver.requestHandler()(req, res);
    
  } catch (error) {
    console.error('❌ 서버 에러:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};
