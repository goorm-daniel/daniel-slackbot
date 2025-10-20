const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

class BroadcastChatbot {
  constructor() {
    this.openai = null;
    this.data = {};
    this.dataPath = path.join(__dirname, '../data');
    this.initialized = false;
    
    // 질문 유형 분석을 위한 키워드
    this.keywords = {
      troubleshooting: ['안나와', '안돼', '문제', '오류', '이상', '안들려', '느려', '끊겨', '검은색'],
      guide: ['어떻게', '방법', '준비', '체크리스트', '해야', '설정', '연결', '설치'],
      location: ['판교', '카카오', '강남', '구름스퀘어'],
      equipment: ['캡처보드', '마이크', '카메라', '맥북', '웹캠', 'OBS', '리모컨', 'PTZ', '믹서', '프로젝터'],
      equipment_list: ['장비리스트', '장비목록', '장비', '리스트', '목록', '어떤장비', '무슨장비'],
      platform: ['유튜브', '줌', '구글미트', '페이스북']
    };
    
    // 자동 초기화 (환경변수에서 API 키 읽기)
    this.autoInitialize();
  }

  // 자동 초기화 (환경변수에서 API 키 읽기)
  async autoInitialize() {
    try {
      // dotenv 로드 (이미 로드되었을 수도 있음)
      if (!process.env.OPENAI_API_KEY) {
        require('dotenv').config();
      }
      
      const apiKey = process.env.OPENAI_API_KEY;
      if (apiKey) {
        console.log('🔑 환경변수에서 API 키를 자동으로 읽어왔습니다.');
        await this.initialize(apiKey);
        this.initialized = true;
      } else {
        console.log('⚠️  환경변수에 OPENAI_API_KEY가 설정되지 않았습니다.');
        console.log('   수동으로 API 키를 입력해야 합니다.');
      }
    } catch (error) {
      console.error('❌ 자동 초기화 실패:', error.message);
    }
  }

  // OpenAI API 초기화
  async initialize(apiKey) {
    try {
      this.openai = new OpenAI({
        apiKey: apiKey
      });
      console.log('✅ OpenAI API 초기화 완료');
      return true;
    } catch (error) {
      console.error('❌ OpenAI API 초기화 실패:', error.message);
      return false;
    }
  }

  // JSON 데이터 파일들을 로드
  async loadData() {
    try {
      console.log('=== JSON 파일 로딩 시작 ===');
      
      const files = [
        'platforms.json',
        'equipment.json', 
        'equipment_list.json',
        'obs_guide.json',
        'locations.json',
        'zoom_guide.json',
        'checklists_and_faq.json'
      ];

      for (const file of files) {
        const filePath = path.join(this.dataPath, file);
        console.log(`📁 로딩 중: ${file}`);
        
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const fileName = file.replace('.json', '');
        this.data[fileName] = JSON.parse(fileContent);
        
        console.log(`✅ ${file} 로딩 성공`);
        console.log(`   키 목록:`, Object.keys(this.data[fileName]));
      }

      console.log('=== 모든 데이터 파일 로드 완료 ===');
      console.log('✅ 데이터 로드 완료:', Object.keys(this.data).join(', '));
      return true;
    } catch (error) {
      console.error('❌ 데이터 파일 로드 실패:', error.message);
      console.error('   파일 경로를 확인하세요:', error.path || '경로 정보 없음');
      return false;
    }
  }

  // 안전한 데이터 검색 함수
  searchRelevantData(question) {
    console.log(`🔍 검색 시작: "${question}"`);
    
    const relevantData = {};
    const safeData = {
      checklists: this.data?.checklists_and_faq || {},
      obsGuide: this.data?.obs_guide || {},
      locations: this.data?.locations || {},
      equipment: this.data?.equipment || {},
      equipment_list: this.data?.equipment_list || {},
      platforms: this.data?.platforms || {},
      zoomGuide: this.data?.zoom_guide || {}
    };
    
    // 각 데이터 소스 상태 체크
    console.log('데이터 로딩 상태:');
    Object.keys(safeData).forEach(key => {
      console.log(`  ${key}:`, Object.keys(safeData[key]).length > 0 ? '✅' : '❌');
    });
    
    // 키워드 기반 검색 (안전한 방식)
    if (question.includes('화면') || question.includes('안나와')) {
      const checklistKeys = Object.keys(safeData.checklists);
      console.log('checklists 사용 가능한 키들:', checklistKeys);
      
      // 가능한 키 이름들을 확인
      const possibleKeys = ['화면관련문제', '노트북연결시화면인식문제', '자주묻는질문FAQ'];
      
      possibleKeys.forEach(key => {
        if (safeData.checklists[key]) {
          relevantData[key] = safeData.checklists[key];
          console.log(`✅ ${key} 데이터 추가됨`);
        }
      });
    }
    
    if (question.includes('OBS') && safeData.obsGuide) {
      relevantData.obs = safeData.obsGuide;
      console.log('✅ OBS 가이드 데이터 추가됨');
    }
    
    if (question.includes('판교') && safeData.locations?.구름스퀘어_판교) {
      relevantData.판교 = safeData.locations.구름스퀘어_판교;
      console.log('✅ 판교 위치 데이터 추가됨');
    }
    
    if (question.includes('카카오') && safeData.locations?.카카오테크_부트캠프) {
      relevantData.카카오 = safeData.locations.카카오테크_부트캠프;
      console.log('✅ 카카오 위치 데이터 추가됨');
    }
    
    if (question.includes('강남') && safeData.locations?.구름스퀘어_강남) {
      relevantData.강남 = safeData.locations.구름스퀘어_강남;
      console.log('✅ 강남 위치 데이터 추가됨');
    }
    
    if (question.includes('줌') && safeData.zoomGuide) {
      relevantData.줌 = safeData.zoomGuide;
      console.log('✅ 줌 가이드 데이터 추가됨');
    }
    
    if (question.includes('마이크') && safeData.checklists?.사운드연결문제) {
      relevantData.사운드 = safeData.checklists.사운드연결문제;
      console.log('✅ 사운드 연결 문제 데이터 추가됨');
    }
    
    // 장비 리스트 관련 질문 처리
    if ((question.includes('장비') && question.includes('리스트')) || 
        question.includes('장비목록') || 
        question.includes('어떤장비') || 
        question.includes('무슨장비') ||
        question.includes('장비') && (question.includes('목록') || question.includes('리스트'))) {
      if (safeData.equipment_list?.장비리스트) {
        relevantData.장비리스트 = safeData.equipment_list.장비리스트;
        console.log('✅ 장비 리스트 데이터 추가됨');
      }
    }
    
    console.log('검색된 데이터 키들:', Object.keys(relevantData));
    return relevantData;
  }

  // 사용자 질문 분석 (문제해결 vs 가이드 요청)
  analyzeQuestion(question) {
    const lowerQuestion = question.toLowerCase();
    
    let questionType = 'general';
    let matchedKeywords = [];

    // 문제해결 키워드 체크
    const troubleshootingMatches = this.keywords.troubleshooting.filter(keyword => 
      lowerQuestion.includes(keyword)
    );
    
    // 가이드 요청 키워드 체크
    const guideMatches = this.keywords.guide.filter(keyword => 
      lowerQuestion.includes(keyword)
    );

    // 장비 관련 키워드 체크
    const equipmentMatches = this.keywords.equipment.filter(keyword => 
      lowerQuestion.includes(keyword)
    );

    // 위치 관련 키워드 체크
    const locationMatches = this.keywords.location.filter(keyword => 
      lowerQuestion.includes(keyword)
    );

    // 플랫폼 관련 키워드 체크
    const platformMatches = this.keywords.platform.filter(keyword => 
      lowerQuestion.includes(keyword)
    );

    matchedKeywords = [...troubleshootingMatches, ...guideMatches, ...equipmentMatches, ...locationMatches, ...platformMatches];

    // 질문 유형 결정
    if (troubleshootingMatches.length > 0) {
      questionType = 'troubleshooting';
    } else if (guideMatches.length > 0) {
      questionType = 'guide';
    }

    // 안전한 데이터 검색 함수 사용
    const relevantData = this.searchRelevantData(question);

    return {
      type: questionType,
      keywords: matchedKeywords,
      relevantData: Object.keys(relevantData).length > 0 ? [relevantData] : [],
      originalQuestion: question
    };
  }

  // ChatGPT API를 통한 답변 생성
  async generateResponse(analysis) {
    if (!this.openai) {
      throw new Error('OpenAI API가 초기화되지 않았습니다.');
    }

    const { type, keywords, relevantData, originalQuestion } = analysis;

    // 시스템 프롬프트 생성
    const systemPrompt = `당신은 구름 중계팀의 전문 중계 지원 AI입니다. 
제공된 데이터를 기반으로 친근하고 전문적인 톤으로 답변하며, 
단계별 가이드와 이모지를 적절히 활용해주세요.

답변 스타일:
- 이모지 활용 (🖥️, 📹, 🔊, ⚡, ✅, ❌ 등)
- 단계별 번호 매기기 (1️⃣, 2️⃣, 3️⃣ 등)
- 친근하고 도움이 되는 톤
- 구체적인 해결 방법 제시
- 백업 방안도 함께 제시

이미지와 링크 처리:
- 데이터에 이미지 URL이 있는 경우, 해당 이미지를 참조하여 설명
- 상세가이드링크가 있는 경우, "자세한 내용은 [여기](링크)를 참고하세요" 형태로 제시
- 장소별 기본정보가 있는 경우, 해당 장소의 이미지와 연락처 정보도 함께 제공

재질문 가이드:
- 답변에 확신이 없거나 추가 정보가 필요한 경우, 구체적인 재질문을 제시
- 예: "어떤 장비를 사용하고 계신가요?", "어느 단계에서 문제가 발생했나요?"
- 사용자가 더 정확한 답변을 받을 수 있도록 도움

현재 질문 유형: ${type === 'troubleshooting' ? '문제해결' : type === 'guide' ? '가이드요청' : '일반질문'}`;

    // 관련 데이터를 문자열로 변환
    const contextData = relevantData?.length > 0 
      ? JSON.stringify(relevantData, null, 2)
      : JSON.stringify(this.data || {}, null, 2);

    const userPrompt = `사용자 질문: "${originalQuestion}"

관련 키워드: ${keywords.join(', ')}

관련 데이터:
${contextData}

위 데이터를 참고하여 질문에 대한 상세하고 실용적인 답변을 제공해주세요.

답변 가이드:
1. 제공된 데이터를 우선적으로 활용하여 답변
2. 데이터가 부족하거나 불확실한 경우, 구체적인 재질문 제시
3. 사용자가 더 정확한 도움을 받을 수 있도록 안내
4. 친근하고 전문적인 톤 유지`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('❌ ChatGPT API 호출 실패:', error.message);
      throw error;
    }
  }

  // Slack용 풍부한 메시지 생성 함수
  generateRichMessage(analysis, response) {
    const { relevantData } = analysis;
    const richMessage = {
      text: response,
      blocks: []
    };

    console.log('🎨 풍부한 메시지 생성 시작');
    console.log('📊 관련 데이터:', JSON.stringify(relevantData, null, 2));

    // 기본 텍스트 블록 추가
    richMessage.blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: response
      }
    });

    // 관련 데이터에서 이미지와 링크 정보 추출
    if (relevantData && relevantData.length > 0) {
      const data = relevantData[0];
      console.log('📋 추출된 데이터 키들:', Object.keys(data));
      
      // 장소별 기본정보가 있는 경우 (최상위 레벨)
      if (data.이름) {
        console.log('🏢 기본정보 발견:', data.이름);
        
        // 상세 가이드 링크가 있는 경우
        if (data.상세가이드링크) {
          console.log('🔗 상세 가이드 링크 추가:', data.상세가이드링크);
          richMessage.blocks.push({
            type: "section",
            text: {
              type: "mrkdwn",
              text: `📚 *자세한 가이드*: <${data.상세가이드링크}|${data.이름} 상세 가이드>`
            }
          });
        }

        // 연락처 정보가 있는 경우
        if (data.연락처) {
          console.log('📞 연락처 정보 추가:', data.연락처);
          richMessage.blocks.push({
            type: "section",
            text: {
              type: "mrkdwn",
              text: `📞 *연락처*: ${data.연락처}`
            }
          });
        }
      }

      // 각 섹션별 링크 처리 (이미지 제거)
      Object.keys(data).forEach(key => {
        if (key !== '이름' && key !== '설명' && key !== '상세가이드링크' && key !== '연락처' && data[key] && typeof data[key] === 'object') {
          const section = data[key];
          console.log(`🔍 섹션 처리: ${key}`, section);
          
          // 섹션에 상세 가이드 링크가 있는 경우
          if (section.상세가이드링크) {
            console.log('🔗 섹션 상세 가이드 링크 추가:', section.상세가이드링크);
            richMessage.blocks.push({
              type: "section",
              text: {
                type: "mrkdwn",
                text: `🔗 *${section.설명 || key} 상세 가이드*: <${section.상세가이드링크}|여기>를 클릭하세요`
              }
            });
          }
        }
      });
    }

    console.log('🎨 최종 풍부한 메시지 블록 수:', richMessage.blocks.length);
    return richMessage;
  }

  // 메인 처리 함수
  async processQuestion(question, apiKey) {
    try {
      // API 초기화 (필요한 경우)
      if (!this.openai) {
        if (apiKey) {
          await this.initialize(apiKey);
        } else if (!this.initialized) {
          throw new Error('OpenAI API 키가 설정되지 않았습니다. 환경변수에 OPENAI_API_KEY를 설정하거나 API 키를 직접 제공해주세요.');
        }
      }

      // 데이터 로드 (필요한 경우)
      if (Object.keys(this.data || {}).length === 0) {
        await this.loadData();
      }

      console.log(`\n📝 사용자 질문: "${question}"`);

      // 질문 분석
      const analysis = this.analyzeQuestion(question);
      console.log(`🔍 분석 결과: ${analysis.type} (키워드: ${analysis.keywords.join(', ')})`);

      // 답변 생성
      const response = await this.generateResponse(analysis);
      
      // 풍부한 메시지 생성
      const richMessage = this.generateRichMessage(analysis, response);
      
      return {
        success: true,
        question: question,
        analysis: analysis,
        response: response,
        richMessage: richMessage
      };

    } catch (error) {
      console.error('❌ 질문 처리 중 오류:', error.message);
      return {
        success: false,
        error: error.message,
        question: question
      };
    }
  }

  // 데이터 상태 확인
  getDataStatus() {
    return {
      openai_initialized: !!this.openai,
      data_loaded: Object.keys(this.data || {}).length,
      available_data: Object.keys(this.data || {})
    };
  }
}

module.exports = BroadcastChatbot;
