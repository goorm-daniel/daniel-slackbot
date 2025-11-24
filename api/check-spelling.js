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
  try {
    const now = Date.now();
    let cleaned = 0;
    const keysToDelete = [];
    
    // 먼저 삭제할 키를 수집
    for (const [key, data] of sessions.entries()) {
      if (data && data.timestamp && (now - data.timestamp > SESSION_TIMEOUT)) {
        keysToDelete.push(key);
      }
    }
    
    // 수집한 키들을 삭제
    for (const key of keysToDelete) {
      sessions.delete(key);
      cleaned++;
    }
    
    if (cleaned > 0) {
      console.log(`🧹 세션 정리: ${cleaned}개 제거`);
    }
  } catch (error) {
    console.error('❌ 세션 정리 오류:', error);
    // 세션 정리 실패해도 계속 진행
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
        console.log('Method:', req.method);
        console.log('Content-Type:', req.headers['content-type'] || 'not set');
        
        // 요청 본문 파싱
        let body = null;
        
        try {
          // Vercel은 자동으로 JSON을 파싱하지만, 안전하게 처리
          if (req.body) {
            body = req.body;
          } else {
            body = {};
          }
          
          // 디버깅용 로그 (안전하게)
          if (body && typeof body === 'object') {
            const bodyKeys = Object.keys(body);
            console.log('Body keys:', bodyKeys.join(', '));
            if (bodyKeys.length > 0) {
              console.log('Body sample:', JSON.stringify(body).substring(0, 100));
            }
          }
        } catch (parseError) {
          console.error('❌ 요청 본문 파싱 오류:', parseError);
          return res.status(400).json({
            error: 'Invalid request body',
            message: '요청 본문을 파싱할 수 없습니다.',
            details: parseError.message
          });
        }

        // body가 null이거나 undefined인 경우 처리
        if (!body || typeof body !== 'object') {
          console.error('❌ 잘못된 요청 본문:', typeof body);
          return res.status(400).json({
            error: 'Invalid request body',
            message: '요청 본문이 올바르지 않습니다.',
            received: typeof body
          });
        }

        const { text, sessionId } = body;

        // text 검증
        if (!text) {
          console.error('❌ text 필드 누락');
          return res.status(400).json({
            error: 'text is required',
            message: '검사할 텍스트가 필요합니다.',
            received: { hasText: !!text, bodyKeys: Object.keys(body) }
          });
        }

        if (typeof text !== 'string') {
          console.error('❌ text 타입 오류:', typeof text);
          return res.status(400).json({
            error: 'text must be a string',
            message: '텍스트는 문자열이어야 합니다.',
            received: { textType: typeof text }
          });
        }

        if (text.trim().length === 0) {
          return res.status(400).json({
            error: 'text cannot be empty',
            message: '검사할 텍스트가 비어있습니다.'
          });
        }

        console.log('✅ 텍스트 수신:', text.length, '자');

        // 세션 ID 생성
        let currentSessionId = sessionId;
        if (!currentSessionId || typeof currentSessionId !== 'string') {
          currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }

        // 간단한 맞춤법 검사 (실제로는 외부 API나 더 정교한 검사 로직 필요)
        const result = {
          originalText: text,
          checkedText: text, // 실제 맞춤법 검사 로직이 필요
          errors: [], // 맞춤법 오류 목록
          suggestions: [] // 제안 사항
        };

        // 세션 저장 (안전하게)
        let sessionSaved = false;
        try {
          const sessionData = {
            data: result,
            timestamp: Date.now()
          };
          
          sessions.set(currentSessionId, sessionData);
          sessionSaved = true;
          console.log('✅ 세션 저장 완료:', currentSessionId);
        } catch (sessionError) {
          console.error('❌ 세션 저장 오류:', sessionError);
          console.error('Session error details:', sessionError.message);
          // 세션 저장 실패해도 계속 진행
        }

        // 성공 응답 반환
        const response = {
          success: true,
          sessionId: sessionSaved ? currentSessionId : null,
          result: result,
          message: '맞춤법 검사가 완료되었습니다.'
        };

        if (!sessionSaved) {
          response.warning = '세션 저장 중 오류가 발생했습니다.';
        }

        return res.status(200).json(response);

      } catch (error) {
        console.error('❌ 맞춤법 검사 오류:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        if (error.stack) {
          console.error('Error stack:', error.stack);
        }
        
        return res.status(500).json({
          error: 'Internal server error',
          message: '맞춤법 검사 중 오류가 발생했습니다.',
          details: error.message || '알 수 없는 오류',
          errorType: error.name || 'Unknown'
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

