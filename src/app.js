const express = require('express');
const { App } = require('@slack/bolt');
require('dotenv').config();

const BroadcastChatbot = require('./chatbot-logic');

const app = express();
const port = process.env.PORT || 3000;

// 챗봇 인스턴스
const chatbot = new BroadcastChatbot();

// 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Slack Bolt 앱 설정 (Express 서버와 분리)
const slackApp = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  processBeforeResponse: true
});

// Slack 이벤트 엔드포인트
app.post('/slack/events', (req, res) => {
  slackApp.receiver.requestHandler(req, res);
});

// 루트 엔드포인트 - 상태 확인
app.get('/', (req, res) => {
  res.json({
    message: '🤖 구름 중계팀 AI 챗봇이 실행 중입니다!',
    status: 'running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      slack: '/slack/events',
      dashboard: '/dashboard',
      health: '/health'
    }
  });
});

// 헬스 체크 엔드포인트
app.get('/health', (req, res) => {
  const status = chatbot.getDataStatus();
  res.json({
    status: 'healthy',
    chatbot: {
      openai_initialized: status.openai_initialized,
      data_loaded: status.data_loaded,
      available_data: status.available_data
    },
    timestamp: new Date().toISOString()
  });
});

// 웹 대시보드
app.get('/dashboard', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>구름 중계팀 AI 챗봇</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #2c3e50; text-align: center; margin-bottom: 30px; }
            .status { background: #e8f5e8; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .examples { background: #f8f9fa; padding: 20px; border-radius: 5px; }
            .example { background: white; padding: 10px; margin: 5px 0; border-left: 3px solid #3498db; }
            .emoji { font-size: 1.2em; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1><span class="emoji">🤖</span> 구름 중계팀 AI 챗봇</h1>
            
            <div class="status">
                <h3><span class="emoji">✅</span> 서비스 상태</h3>
                <p>챗봇이 정상적으로 실행 중입니다!</p>
                <p><strong>사용법:</strong> 슬랙에서 <code>@구름중계봇</code> 멘션으로 질문해주세요.</p>
            </div>
            
            <div class="examples">
                <h3><span class="emoji">💬</span> 예시 질문들</h3>
                <div class="example">맥북으로 연결하는데 화면이 안나와요</div>
                <div class="example">OBS에서 화면이 검은색으로 나와요</div>
                <div class="example">마이크 소리가 안들려요</div>
                <div class="example">판교에서 중계 준비 어떻게 해요?</div>
                <div class="example">OBS 스튜디오 설정 방법 알려주세요</div>
                <div class="example">줌으로 라이브 스트리밍 하는 방법은?</div>
                <div class="example">인터넷이 느려서 화질이 떨어져요</div>
                <div class="example">캡처보드가 인식이 안돼요</div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #7f8c8d;">
                <p>구름 중계팀 AI 챗봇 v1.0.0</p>
            </div>
        </div>
    </body>
    </html>
  `);
});

// API 엔드포인트 (테스트용)
app.post('/api/chat', async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({
        error: '질문을 입력해주세요.',
        example: '맥북 화면이 안나와요'
      });
    }
    
    console.log('📝 API 질문 받음:', question);
    
    const result = await chatbot.processQuestion(question);
    
    if (result.success) {
      res.json({
        success: true,
        question: question,
        response: result.response,
        analysis: result.analysis
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        question: question
      });
    }
  } catch (error) {
    console.error('❌ API 오류:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.',
      message: error.message
    });
  }
});

// Slack 이벤트 처리 (Bolt 방식)
slackApp.event('app_mention', async ({ event, client }) => {
  try {
    console.log('📝 슬랙 멘션 받음:', event.text);
    
    // 멘션 제거하고 질문만 추출
    const question = event.text.replace(/<@[^>]+>/g, '').trim();
    
    if (!question) {
      await client.chat.postMessage({
        channel: event.channel,
        text: '안녕하세요! 중계 관련 질문을 해주세요. 예: "맥북 화면이 안나와요"',
        thread_ts: event.ts
      });
      return;
    }
    
    // 챗봇 답변 생성
    const result = await chatbot.processQuestion(question);
    
    if (result.success) {
      await client.chat.postMessage({
        channel: event.channel,
        text: result.response,
        thread_ts: event.ts
      });
    } else {
      await client.chat.postMessage({
        channel: event.channel,
        text: '😅 죄송합니다. 답변 생성 중 문제가 발생했습니다. 다시 시도해주세요.',
        thread_ts: event.ts
      });
    }
  } catch (error) {
    console.error('❌ 슬랙 이벤트 처리 오류:', error);
    try {
      await client.chat.postMessage({
        channel: event.channel,
        text: '😅 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
        thread_ts: event.ts
      });
    } catch (slackError) {
      console.error('❌ 슬랙 메시지 전송 실패:', slackError);
    }
  }
});

// 에러 처리
slackApp.error((error) => {
  console.error('❌ 슬랙 앱 에러:', error);
});

// 서버 시작 (로컬 개발용)
if (require.main === module) {
  app.listen(port, () => {
    console.log(`🚀 구름 중계팀 AI 챗봇이 포트 ${port}에서 실행 중입니다.`);
    console.log(`📊 대시보드: http://localhost:${port}/dashboard`);
    console.log(`🔍 헬스체크: http://localhost:${port}/health`);
    console.log(`🔗 Slack 이벤트: http://localhost:${port}/slack/events`);
  });
}

module.exports = app;
