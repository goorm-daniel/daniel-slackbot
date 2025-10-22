/**
 * test.js
 * VX RAG 봇 - 간단한 동작 확인 테스트
 */

const { SimpleRAGAdapter } = require('./src/adapters/SimpleRAGAdapter');

async function testRAG() {
  console.log('🧪 VX RAG 봇 테스트 시작...\n');
  
  const adapter = new SimpleRAGAdapter();
  
  try {
    // 초기화
    console.log('🚀 RAG 시스템 초기화...');
    await adapter.initialize();
    console.log('✅ 초기화 완료!\n');
    
    // 테스트 질문들
    const questions = [
      'A7S3 카메라 추천해주세요',
      '강남에서 중계 준비 어떻게 해요?',
      'OBS 설정 도와주세요'
    ];
    
    for (const question of questions) {
      console.log(`❓ 질문: ${question}`);
      const response = await adapter.processMessage(question);
      console.log(`✅ 응답: ${response.substring(0, 100)}...\n`);
    }
    
    console.log('🎉 모든 테스트 통과! VX RAG 봇이 정상 작동합니다.');
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    process.exit(1);
  }
}

// 환경변수 로딩
require('dotenv').config();

// 테스트 실행
testRAG();
