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
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // OPTIONS 요청 처리
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    // POST 요청만 처리
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }
    
    console.log('📨 Slack 이벤트 수신:', req.url);
    
    // Slack 이벤트 처리
    await app.receiver.requestHandler()(req, res);
    
  } catch (error) {
    console.error('❌ Vercel 함수 에러:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};
