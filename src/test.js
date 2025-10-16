// 환경변수 로드
require('dotenv').config();

const readline = require('readline');
const BroadcastChatbot = require('./chatbot-logic');

class ChatbotTester {
  constructor() {
    this.chatbot = new BroadcastChatbot();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    // 샘플 질문들
    this.sampleQuestions = [
      "맥북으로 연결하는데 화면이 안나와요",
      "OBS에서 화면이 검은색으로 나와요", 
      "마이크 소리가 안들려요",
      "판교에서 중계 준비 어떻게 해요?",
      "OBS 스튜디오 설정 방법 알려주세요",
      "줌으로 라이브 스트리밍 하는 방법은?",
      "인터넷이 느려서 화질이 떨어져요",
      "캡처보드가 인식이 안돼요"
    ];
  }

  // 시작 화면 출력
  showWelcome() {
    console.log('\n🤖 구름 중계팀 AI 챗봇');
    console.log('='.repeat(50));
    console.log('안녕하세요! 중계 관련 질문을 언제든지 해주세요.');
    console.log('📋 사용 가능한 명령어:');
    console.log('  - 질문 입력: 중계 관련 질문을 자유롭게 입력하세요');
    console.log('  - "샘플": 예시 질문 목록 보기');
    console.log('  - "상태": 챗봇 상태 확인');
    console.log('  - "종료": 챗봇 종료');
    console.log('='.repeat(50));
  }

  // 샘플 질문 목록 출력
  showSampleQuestions() {
    console.log('\n📝 샘플 질문들:');
    this.sampleQuestions.forEach((question, index) => {
      console.log(`  ${index + 1}. ${question}`);
    });
    console.log('\n위 질문 중 하나를 복사해서 입력하거나, 직접 질문을 입력해보세요!');
  }

  // 봇 상태 확인
  showStatus() {
    const status = this.chatbot.getDataStatus();
    console.log('\n🔍 봇 상태:');
    console.log(`  OpenAI 초기화: ${status.openai_initialized ? '✅' : '❌'}`);
    console.log(`  데이터 로드: ${status.data_loaded}개 파일`);
    console.log(`  로드된 데이터: ${status.available_data.join(', ')}`);
  }

  // 시스템 상태 확인 (개발자용)
  checkSystemStatus() {
    console.log('\n🔧 시스템 상태 (개발자용):');
    console.log(`  API 키 설정: ${process.env.OPENAI_API_KEY ? '✅' : '❌'}`);
    console.log(`  데이터 로드: ${this.chatbot.getDataStatus().data_loaded}개 파일`);
    console.log(`  초기화 상태: ${this.chatbot.openai ? '✅' : '❌'}`);
  }

  // 질문 처리
  async processQuestion(question) {
    console.log('\n💭 답변을 준비하고 있습니다...');
    
    try {
      const result = await this.chatbot.processQuestion(question);
      
      if (result.success) {
        console.log('\n🤖 답변:');
        console.log('─'.repeat(50));
        console.log(result.response);
        console.log('─'.repeat(50));
        
        // 추가 질문 제안
        console.log('\n💡 더 궁금한 점이 있으시면 언제든지 질문해주세요!');
      } else {
        console.log(`\n😅 죄송합니다. 답변 생성 중 문제가 발생했습니다.`);
        console.log(`   다시 시도해주시거나 다른 질문을 해주세요.`);
        console.log(`   (오류: ${result.error})`);
      }
    } catch (error) {
      console.log(`\n😅 죄송합니다. 일시적인 문제가 발생했습니다.`);
      console.log(`   잠시 후 다시 시도해주세요.`);
      console.log(`   (오류: ${error.message})`);
    }
  }

  // 사용자 입력 처리
  async handleInput(input) {
    const trimmedInput = input.trim().toLowerCase();
    
    if (trimmedInput === '종료' || trimmedInput === 'quit' || trimmedInput === 'exit') {
      console.log('\n👋 구름 중계팀 챗봇을 이용해주셔서 감사합니다!');
      console.log('   언제든지 다시 이용해주세요. 안녕히가세요! 👋');
      this.rl.close();
      return;
    }
    
    if (trimmedInput === '샘플') {
      this.showSampleQuestions();
      return;
    }
    
    if (trimmedInput === '상태') {
      this.showStatus();
      return;
    }
    
    if (trimmedInput === '시스템') {
      this.checkSystemStatus();
      return;
    }
    
    if (trimmedInput === '') {
      console.log('💬 질문을 입력해주세요. "샘플"을 입력하면 예시 질문을 볼 수 있습니다.');
      return;
    }
    
    // 질문 처리
    await this.processQuestion(input);
  }

  // 메인 실행 함수
  async run() {
    this.showWelcome();
    
    // 자동 초기화 대기 (환경변수에서 API 키 읽기)
    console.log('\n⏳ 챗봇을 준비하고 있습니다...');
    await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5초 대기
    
    // 초기화 상태 확인
    if (!this.chatbot.openai) {
      console.log('❌ 챗봇 초기화에 실패했습니다.');
      console.log('   관리자에게 문의해주세요.');
      return;
    }
    
    console.log('\n✅ 챗봇이 준비되었습니다! 언제든지 질문해주세요.');
    console.log('💡 팁: "샘플"을 입력하면 예시 질문을 볼 수 있습니다.');
    
    // 사용자 입력 대기
    const askQuestion = () => {
      this.rl.question('\n❓ 질문을 입력하세요: ', async (input) => {
        await this.handleInput(input);
        if (this.rl.closed) return;
        askQuestion();
      });
    };
    
    askQuestion();
  }
}

// 테스트 실행
if (require.main === module) {
  const tester = new ChatbotTester();
  tester.run().catch(console.error);
}

module.exports = ChatbotTester;
