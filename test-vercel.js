/**
 * test-vercel.js
 * Vercel 배포용 API 테스트
 */

const { SimpleRAGAdapter } = require('./src/adapters/SimpleRAGAdapter');

async function testVercelAPI() {
  console.log('🧪 Vercel API 테스트 시작...\n');
  
  try {
    // RAG 어댑터 테스트
    console.log('🚀 RAG 어댑터 초기화...');
    const adapter = new SimpleRAGAdapter();
    await adapter.initialize();
    console.log('✅ RAG 어댑터 초기화 완료\n');
    
    // 테스트 질문
    const testQuestions = [
      'A7S3 카메라 추천해주세요',
      '강남에서 중계 준비 어떻게 해요?',
      'OBS 설정 도와주세요'
    ];
    
    for (const question of testQuestions) {
      console.log(`❓ 질문: ${question}`);
      const response = await adapter.processMessage(question);
      console.log(`✅ 응답: ${response.substring(0, 100)}...\n`);
    }
    
    console.log('🎉 Vercel API 테스트 성공!');
    console.log('📝 배포 시 확인사항:');
    console.log('1. Vercel 환경변수 설정 확인');
    console.log('2. Slack Event Subscriptions URL 설정');
    console.log('3. Slack 봇 권한 확인');
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    console.log('\n🔧 문제 해결 방법:');
    console.log('1. 환경변수 확인 (.env 파일)');
    console.log('2. OpenAI API 키 유효성 확인');
    console.log('3. 네트워크 연결 확인');
  }
}

// 환경변수 로딩
require('dotenv').config();

// 테스트 실행
testVercelAPI();
