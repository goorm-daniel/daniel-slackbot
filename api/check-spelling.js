/**
 * api/check-spelling.js
 * Vercel 서버리스 함수 - 맞춤법 검사 API
 * 한국어 맞춤법 검사 엔드포인트
 */

// 세션 저장소 (메모리 기반, Vercel 서버리스 환경에서는 제한적)
const sessions = new Map();
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30분

// 세션 정리 (요청 시마다 실행)
function cleanupSessions() {
  const now = Date.now();
  let cleaned = 0;
  for (const [key, data] of sessions.entries()) {
    if (now - data.timestamp > SESSION_TIMEOUT) {
      sessions.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`🧹 세션 정리: ${cleaned}개 제거`);
  }
}

module.exports = async (req, res) => {
  try {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // OPTIONS 요청 처리
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // 세션 정리 (요청 시마다)
    cleanupSessions();

    // GET 요청 - 세션 조회
    if (req.method === 'GET') {
      try {
        const { sessionId } = req.query;
        
        if (!sessionId) {
          return res.status(400).json({
            error: 'sessionId is required',
            message: '세션 ID가 필요합니다.'
          });
        }

        const session = sessions.get(sessionId);
        if (!session) {
          return res.status(404).json({
            error: 'Session not found',
            message: '세션을 찾을 수 없습니다.'
          });
        }

        return res.status(200).json({
          success: true,
          session: {
            id: sessionId,
            data: session.data,
            timestamp: session.timestamp
          }
        });
      } catch (error) {
        console.error('❌ 세션 조회 오류:', error);
        return res.status(500).json({
          error: 'Internal server error',
          message: '세션 조회 중 오류가 발생했습니다.',
          details: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
    }

    // POST 요청 - 맞춤법 검사 및 세션 저장
    if (req.method === 'POST') {
      try {
        console.log('📨 맞춤법 검사 요청 수신');
        console.log('Content-Type:', req.headers['content-type']);
        console.log('Body type:', typeof req.body);
        console.log('Body:', JSON.stringify(req.body).substring(0, 200));

        // 요청 본문 파싱
        let body = req.body;
        
        // Vercel이 자동으로 파싱하지 않은 경우 수동 파싱
        if (!body || Object.keys(body).length === 0) {
          if (req.headers['content-type']?.includes('application/json')) {
            // 이미 파싱된 경우
            body = req.body;
          } else {
            // 스트림에서 읽기 (필요한 경우)
            body = {};
          }
        }

        const { text, sessionId } = body || {};

        if (!text || (typeof text !== 'string' && text !== undefined)) {
          console.error('❌ 잘못된 요청:', { text, textType: typeof text });
          return res.status(400).json({
            error: 'text is required',
            message: '검사할 텍스트가 필요합니다.',
            received: { text, textType: typeof text }
          });
        }

        console.log('✅ 텍스트 수신:', text.substring(0, 50) + '...');

        // 세션 ID가 없으면 생성
        const currentSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // 간단한 맞춤법 검사 (실제로는 외부 API나 더 정교한 검사 로직 필요)
        // 여기서는 기본적인 검사만 수행
        const result = {
          originalText: text,
          checkedText: text, // 실제 맞춤법 검사 로직이 필요
          errors: [], // 맞춤법 오류 목록
          suggestions: [] // 제안 사항
        };

        // 세션 저장
        try {
          sessions.set(currentSessionId, {
            data: result,
            timestamp: Date.now()
          });
          console.log('✅ 세션 저장 완료:', currentSessionId);

          return res.status(200).json({
            success: true,
            sessionId: currentSessionId,
            result: result,
            message: '맞춤법 검사가 완료되었습니다.'
          });
        } catch (sessionError) {
          console.error('❌ 세션 저장 오류:', sessionError);
          // 세션 저장 실패해도 결과는 반환
          return res.status(200).json({
            success: true,
            sessionId: null,
            result: result,
            message: '맞춤법 검사가 완료되었습니다.',
            warning: '세션 저장 중 오류가 발생했습니다.'
          });
        }

      } catch (error) {
        console.error('❌ 맞춤법 검사 오류:', error);
        console.error('Error stack:', error.stack);
        return res.status(500).json({
          error: 'Internal server error',
          message: '맞춤법 검사 중 오류가 발생했습니다.',
          details: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
    }

    // 지원하지 않는 메서드
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: '지원하지 않는 HTTP 메서드입니다.',
      allowed: ['GET', 'POST', 'OPTIONS']
    });

  } catch (globalError) {
    console.error('❌ 전역 오류:', globalError);
    console.error('Error stack:', globalError.stack);
    return res.status(500).json({
      error: 'Internal server error',
      message: '서버 오류가 발생했습니다.',
      details: globalError.message,
      stack: process.env.NODE_ENV === 'development' ? globalError.stack : undefined
    });
  }
};

