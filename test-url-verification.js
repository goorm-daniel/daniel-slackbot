// URL 검증 테스트 스크립트
const fetch = require('node-fetch');

async function testUrlVerification() {
  console.log('🧪 URL 검증 테스트 시작...\n');
  
  const testChallenge = '3eZbrw1aBm2rZgRNFdxV2595E9CY3gmdALWMmHkvFXO7tYXAYM8P';
  
  const testPayload = {
    token: "Jhj5dZrVaK7ZwHHjRyZWjbDl",
    challenge: testChallenge,
    type: "url_verification"
  };
  
  try {
    console.log('📤 테스트 페이로드:', JSON.stringify(testPayload, null, 2));
    
    const response = await fetch('http://localhost:3000/slack/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log('📥 응답 상태:', response.status);
    console.log('📥 응답 헤더:', response.headers.raw());
    
    const responseText = await response.text();
    console.log('📥 응답 내용:', responseText);
    
    if (response.status === 200 && responseText === testChallenge) {
      console.log('✅ URL 검증 테스트 성공!');
      console.log('   - 응답이 challenge 값과 일치함');
      console.log('   - Content-Type이 text/plain임');
    } else {
      console.log('❌ URL 검증 테스트 실패');
      console.log('   - 예상 응답:', testChallenge);
      console.log('   - 실제 응답:', responseText);
    }
    
  } catch (error) {
    console.error('❌ 테스트 중 오류:', error.message);
  }
}

// 서버가 실행 중인지 확인
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/slack/events', {
      method: 'GET'
    });
    console.log('🔍 서버 상태:', response.status);
    return true;
  } catch (error) {
    console.log('❌ 서버가 실행되지 않았습니다. npm start로 서버를 시작해주세요.');
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  
  if (serverRunning) {
    await testUrlVerification();
  }
}

main().catch(console.error);
