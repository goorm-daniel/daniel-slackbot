/**
 * api/slack.js
 * Vercel 서버리스 함수 - Slack 봇 API
 * Vercel 배포용 Slack 이벤트 처리 엔드포인트
 */

const { WebClient } = require('@slack/web-api');
const { SimpleRAGAdapter } = require('../src/adapters/SimpleRAGAdapter');

// RAG 어댑터 인스턴스 (전역으로 유지)
let ragAdapter = null;
let isInitializing = false;

// 중복 요청 방지를 위한 세션 관리
const activeSessions = new Map();

// RAG 시스템 초기화 (한 번만 실행)
async function initializeRAG() {
  if (!ragAdapter && !isInitializing) {
    isInitializing = true;
    try {
      ragAdapter = new SimpleRAGAdapter();
      await ragAdapter.initialize();
      console.log('✅ RAG 시스템 초기화 완료 (Vercel)');
    } catch (error) {
      console.error('❌ RAG 초기화 실패:', error);
      // 폴백 모드로 계속 진행
    } finally {
      isInitializing = false;
    }
  }
  return ragAdapter;
}

module.exports = async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET 요청 - 상태 확인
  if (req.method === 'GET') {
    return res.status(200).json({
      message: '🤖 VX 중계팀 AI 봇 (Vercel 배포)',
      status: 'running',
      ragReady: ragAdapter ? ragAdapter.isReady() : false,
      timestamp: new Date().toISOString()
    });
  }

  // POST 요청 - Slack 이벤트 처리
  if (req.method === 'POST') {
    try {
      console.log('📨 Slack 이벤트 수신:', req.body.type);

      // URL 검증 (Slack 앱 설정 시)
      if (req.body.type === 'url_verification') {
        console.log('🔐 URL 검증 요청');
        return res.status(200).send(req.body.challenge);
      }

      // 이벤트 콜백 처리
      if (req.body.type === 'event_callback') {
        const event = req.body.event;
        console.log('📢 이벤트 타입:', event.type);

        // app_mention 이벤트 처리
        if (event.type === 'app_mention' && !event.bot_id) {
          console.log('📢 멘션 메시지:', event.text);

          // 중복 요청 방지: 같은 이벤트 ID로 이미 처리 중인지 확인
          const eventId = event.client_msg_id || event.ts;
          if (activeSessions.has(eventId)) {
            console.log('⚠️ 중복 요청 감지, 무시:', eventId);
            return res.status(200).json({ status: 'duplicate' });
          }

          // 세션 등록
          activeSessions.set(eventId, Date.now());
          
          // 5분 후 세션 자동 정리
          setTimeout(() => {
            activeSessions.delete(eventId);
          }, 5 * 60 * 1000);

          // RAG 시스템 초기화
          const adapter = await initializeRAG();

          // 멘션 제거하고 질문만 추출
          const question = event.text.replace(/<@[^>]+>/g, '').trim();
          console.log('❓ 추출된 질문:', question);

          if (!question) {
            // 빈 질문에 대한 안내
            const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
            await slack.chat.postMessage({
              channel: event.channel,
              text: '안녕하세요! VX 중계 관련 질문을 해주세요 🎬\n\n예시:\n• A7S3 카메라 추천해주세요\n• 강남에서 중계 준비 어떻게 해요?\n• OBS 설정 도와주세요',
              thread_ts: event.ts
            });
            console.log('✅ 안내 메시지 전송');
            return res.status(200).json({ status: 'ok' });
          }

          try {
            // RAG 시스템으로 처리
            console.log('🤖 RAG 시스템 처리 시작...');
            const ragResponse = await adapter.processMessage(question, event.user);
            console.log('🤖 RAG 시스템 결과:', ragResponse.substring(0, 100) + '...');

            // Slack에 답변 전송
            const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
            await slack.chat.postMessage({
              channel: event.channel,
              text: ragResponse,
              thread_ts: event.ts
            });

            console.log('✅ RAG 답변 전송 완료');
            return res.status(200).json({ status: 'ok' });

          } catch (ragError) {
            console.error('❌ RAG 시스템 처리 오류:', ragError);

            // 오류 시 사용자에게 안내
            try {
              const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
              await slack.chat.postMessage({
                channel: event.channel,
                text: '😅 죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
                thread_ts: event.ts
              });
              console.log('✅ 에러 복구 메시지 전송');
            } catch (slackError) {
              console.error('❌ 슬랙 메시지 전송 실패:', slackError);
            }

            return res.status(200).json({ status: 'error', message: ragError.message });
          }
        }
      }

      // 성공 응답
      return res.status(200).json({ status: 'ok' });

    } catch (error) {
      console.error('❌ API 오류:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  }

  // 지원하지 않는 메서드
  return res.status(405).json({ error: 'Method not allowed' });
};
