const { App } = require('@slack/bolt');
require('dotenv').config();

const BroadcastChatbot = require('./chatbot-logic');

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

// 서버 시작
(async () => {
  try {
    await app.start(process.env.PORT || 3000);
    console.log('🚀 구름 중계팀 AI 슬랙봇이 시작되었습니다!');
    console.log(`📡 포트: ${process.env.PORT || 3000}`);
    console.log('🔗 Slack 이벤트 URL: http://localhost:3000/slack/events');
    console.log('💡 슬랙에서 @봇이름으로 멘션해보세요!');
  } catch (error) {
    console.error('❌ 서버 시작 실패:', error);
    process.exit(1);
  }
})();
