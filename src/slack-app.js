const express = require('express');
const { WebClient } = require('@slack/web-api');
require('dotenv').config();

const BroadcastChatbot = require('./chatbot-logic');

const app = express();
const port = process.env.PORT || 3000;

// 슬랙 웹 클라이언트 초기화
const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
const chatbot = new BroadcastChatbot();

// 미들웨어
app.use(express.json());

// 루트 엔드포인트
app.get('/', (req, res) => {
  res.json({
    message: '🤖 구름 중계팀 AI 슬랙봇 (로컬 개발 서버)',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Slack 이벤트 엔드포인트
app.post('/slack/events', async (req, res) => {
  try {
    console.log('🚀 로컬 서버 - 요청 받음:', req.method);
    console.log('📥 요청 바디:', JSON.stringify(req.body, null, 2));
    
    // 1. URL 검증 처리
    if (req.body && req.body.type === 'url_verification') {
      console.log('🔐 URL 검증 요청');
      const challenge = req.body.challenge;
      
      if (!challenge) {
        return res.status(400).json({ error: 'Missing challenge' });
      }
      
      res.setHeader('Content-Type', 'text/plain');
      res.status(200).send(challenge);
      console.log('✅ URL 검증 완료:', challenge);
      return;
    }
    
    // 2. 이벤트 콜백 처리
    if (req.body.type === 'event_callback') {
      const event = req.body.event;
      console.log('📨 이벤트 타입:', event.type);
      
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
            
            // 풍부한 메시지가 있는 경우 사용, 없으면 기본 텍스트 사용
            const messageOptions = result.richMessage ? {
              channel: event.channel,
              text: result.response, // fallback text
              blocks: result.richMessage.blocks,
              thread_ts: event.ts
            } : {
              channel: event.channel,
              text: result.response,
              thread_ts: event.ts
            };
            
            // 슬랙에 답변 전송
            await slack.chat.postMessage(messageOptions);
            
            console.log('✅ 답변 전송 완료 (풍부한 메시지 포함)');
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
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 서버 시작
app.listen(port, () => {
  console.log('🚀 구름 중계팀 AI 슬랙봇 (로컬 개발 서버)가 시작되었습니다!');
  console.log(`📡 포트: ${port}`);
  console.log('🔗 Slack 이벤트 URL: http://localhost:3000/slack/events');
  console.log('💡 슬랙에서 @봇이름으로 멘션해보세요!');
});
