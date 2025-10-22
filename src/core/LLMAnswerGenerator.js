/**
 * LLMAnswerGenerator.js
 * VX 중계 AI - 간단한 LLM 답변 생성기
 * VX팀 내부 사용에 최적화된 심플한 답변 생성
 */

class LLMAnswerGenerator {
  constructor() {
    this.llmProvider = null;
    this.modelName = 'gpt-3.5-turbo';
  }

  /**
   * LLM 초기화 (간소화)
   */
  async initialize(provider = 'openai') {
    try {
      if (provider === 'openai') {
        const { OpenAI } = require('openai');
        this.llmProvider = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
          timeout: 30000
        });
        this.modelName = 'gpt-3.5-turbo';
      } else {
        // Mock LLM (폴백)
        this.llmProvider = new MockLLMProvider();
        this.modelName = 'mock-gpt-3.5-turbo';
      }
      
      console.log(`LLM 답변 생성기 초기화 완료: ${provider}`);
      
    } catch (error) {
      console.error('LLM 초기화 실패:', error);
      // Mock LLM으로 폴백
      this.llmProvider = new MockLLMProvider();
      this.modelName = 'mock-gpt-3.5-turbo';
      console.log('Mock LLM으로 폴백');
    }
  }

  /**
   * 답변 생성 (VX 데이터만 사용하도록 엄격화)
   */
  async generateAnswer(userQuery, retrievedChunks, questionType = 'general') {
    try {
      // 1. 검색된 청크가 충분한지 확인
      if (!retrievedChunks || retrievedChunks.length === 0) {
        return {
          answer: "죄송합니다. VX 데이터에서 관련 정보를 찾을 수 없습니다. 더 구체적인 질문을 해주시거나 VX팀에 직접 문의해주세요.",
          dataSourced: false,
          confidence: 0,
          questionType: questionType
        };
      }

      const context = this.buildStrictContext(retrievedChunks);
      
      // 2. 컨텍스트가 충분한지 확인
      if (!context || context.trim().length < 30) {
        return {
          answer: "VX 데이터에서 해당 질문에 대한 충분한 정보를 찾을 수 없습니다. 더 구체적으로 질문해주세요.",
          dataSourced: false,
          confidence: 0,
          questionType: questionType
        };
      }

      // 3. 엄격한 프롬프트로 LLM 호출
      const strictPrompt = `당신은 VX팀의 데이터만을 사용하는 전문 어시스턴트입니다.

🚨 절대 규칙:
1. 아래 제공된 VX 데이터에 없는 정보는 절대 추가하지 마세요
2. 일반적인 지식이나 추측으로 답변하지 마세요
3. VX 데이터에 명시된 내용만 사용하세요
4. 답변은 5줄 이내로 간결하게 작성하세요
5. 불필요한 인사말, 서론, 반복 설명 금지

📋 답변 형식:
- VX 보유 정보만 명확하게 나열
- 구체적인 장비명, 수량, 상태 포함
- 이모지 활용해서 가독성 향상
- 하나의 통합된 답변으로 작성

사용자 질문: ${userQuery}

VX 데이터에서 검색된 정보:
${context}

위 VX 데이터만을 바탕으로 간결하고 정확한 답변을 작성하세요. VX 데이터에 없는 내용은 절대 추가하지 마세요.`;

      const response = await this.llmProvider.chat.completions.create({
        model: this.modelName,
        messages: [{ role: 'user', content: strictPrompt }],
        temperature: 0.1, // 더 엄격한 제약
        max_tokens: 300   // 간결한 답변
      });

      const generatedAnswer = response.choices[0].message.content;

      // 4. 답변 검증 - VX 데이터 기반인지 확인
      if (this.isAnswerBasedOnVXData(generatedAnswer, context)) {
        return {
          answer: generatedAnswer,
          dataSourced: true,
          confidence: 0.9,
          questionType: questionType,
          sources: retrievedChunks.map(c => c.chunk.metadata.source),
          tokensUsed: response.usage?.total_tokens || 0
        };
      } else {
        // LLM이 VX 데이터를 벗어난 답변을 했다면 직접 생성
        return {
          answer: this.createDirectVXAnswer(retrievedChunks),
          dataSourced: true,
          confidence: 0.7,
          questionType: questionType,
          fallback: 'direct'
        };
      }

    } catch (error) {
      console.error('LLM 답변 생성 오류:', error);
      
      // 폴백: VX 데이터 직접 제공
      return {
        answer: this.createDirectVXAnswer(retrievedChunks),
        dataSourced: true,
        confidence: 0.6,
        error: error.message,
        fallback: true
      };
    }
  }

  /**
   * 엄격한 컨텍스트 구성 (VX 데이터만)
   */
  buildStrictContext(retrievedChunks) {
    if (!retrievedChunks || retrievedChunks.length === 0) {
      return '';
    }

    return retrievedChunks.map((item, index) => {
      const content = item.chunk.content;
      const source = item.chunk.metadata.source || 'unknown';
      return `[${source}] ${content}`;
    }).join('\n\n');
  }

  /**
   * VX 데이터 직접 답변 생성 (LLM 없이, 간결화)
   */
  createDirectVXAnswer(retrievedChunks) {
    if (!retrievedChunks || retrievedChunks.length === 0) {
      return "VX 데이터에서 관련 정보를 찾을 수 없습니다.";
    }

    let answer = "🎬 VX 보유 정보:\n\n";
    
    // 상위 3개만 간결하게 표시
    retrievedChunks.slice(0, 3).forEach((item, index) => {
      const content = item.chunk.content;
      // 150자 이내로 제한
      const truncated = content.length > 150 
        ? content.substring(0, 150) + '...' 
        : content;
      answer += `${index + 1}. ${truncated}\n\n`;
    });

    const sources = [...new Set(retrievedChunks.map(c => c.chunk.metadata.source))];
    answer += `📚 출처: ${sources.join(', ')}`;

    if (retrievedChunks.length > 3) {
      answer += `\n\n💡 더 구체적인 질문을 하시면 더 정확한 답변을 드릴 수 있습니다.`;
    }

    return answer;
  }

  /**
   * 답변이 VX 데이터 기반인지 검증
   */
  isAnswerBasedOnVXData(answer, vxContext) {
    if (!answer || !vxContext) return false;

    // VX 컨텍스트에서 키워드 추출
    const vxKeywords = this.extractKeywords(vxContext);
    const answerKeywords = this.extractKeywords(answer);

    // VX 데이터의 키워드가 답변에 충분히 포함되어 있는지 확인
    const overlap = vxKeywords.filter(keyword => 
      answerKeywords.some(ak => ak.includes(keyword) || keyword.includes(ak))
    ).length;

    // 최소 30% 이상의 키워드 겹침이 있어야 함
    const overlapRatio = vxKeywords.length > 0 ? overlap / vxKeywords.length : 0;
    
    return overlapRatio >= 0.3 || overlap >= 3;
  }

  /**
   * 키워드 추출
   */
  extractKeywords(text) {
    if (!text) return [];

    const keywords = [];
    const words = text.toLowerCase()
      .replace(/[^\w\s가-힣]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1);

    // 중요 키워드 (VX 관련)
    const importantKeywords = [
      'vx', 'a7s3', 'fx3', '소니', 'sony', 'aputure', '강남', '판교', 
      'obs', 'zoom', '카메라', '렌즈', '마이크', '조명', '삼각대',
      'uwp-d21', '맥북', '캡처보드', '중계', '방송', '촬영', '장비'
    ];

    words.forEach(word => {
      if (importantKeywords.includes(word)) {
        keywords.push(word);
      }
    });

    return [...new Set(keywords)];
  }

  /**
   * 기존 컨텍스트 구성 (하위 호환성)
   */
  buildContext(retrievedChunks) {
    return this.buildStrictContext(retrievedChunks);
  }

  /**
   * 폴백 답변 생성 (간소화)
   */
  generateFallbackAnswer(userQuery, retrievedChunks) {
    if (!retrievedChunks || retrievedChunks.length === 0) {
      return `죄송합니다. "${userQuery}"에 대한 관련 정보를 찾을 수 없습니다.`;
    }

    let answer = `"${userQuery}"에 대한 관련 정보입니다:\n\n`;
    
    retrievedChunks.slice(0, 3).forEach((item, index) => {
      answer += `${index + 1}. ${item.chunk.content}\n\n`;
    });

    return answer;
  }
}

/**
 * Mock LLM Provider (간소화)
 */
class MockLLMProvider {
  constructor() {
    this.responses = {
      'A7S3': 'A7S3는 VX팀이 보유한 Sony의 전문 미러리스 카메라입니다. 저조도 환경에서 뛰어난 성능을 보이며, 4K 녹화가 가능하여 중계방송에 최적화되어 있습니다.',
      '강남': '강남 구름스퀘어는 VX팀의 주요 중계 장소입니다. 13층 교육장과 14층 타운홀에서 중계가 가능하며, PTZ 카메라와 고급 음향 시스템이 구비되어 있습니다.',
      'OBS': 'OBS Studio는 VX팀에서 중계방송에 사용하는 핵심 소프트웨어입니다. 장면 전환, 소스 관리, 필터 적용 등의 기능을 통해 전문적인 중계가 가능합니다.',
      'Zoom': 'Zoom은 VX팀에서 원격 교육과 화상회의에 사용하는 플랫폼입니다. BGM 설정, 화면 공유, 녹화 등의 기능을 통해 다양한 형태의 중계가 가능합니다.'
    };
  }

  get chat() {
    return {
      completions: {
        create: async (params) => {
          const userMessage = params.messages.find(m => m.role === 'user');
          const query = userMessage.content.toLowerCase();
          
          let response = '죄송합니다. 해당 질문에 대한 구체적인 정보를 찾을 수 없습니다.';
          
          if (query.includes('a7s3') || query.includes('카메라')) {
            response = this.responses['A7S3'];
          } else if (query.includes('강남') || query.includes('타운홀')) {
            response = this.responses['강남'];
          } else if (query.includes('obs')) {
            response = this.responses['OBS'];
          } else if (query.includes('zoom')) {
            response = this.responses['Zoom'];
          } else {
            response = `"${userMessage.content}"에 대한 답변입니다. VX팀의 실제 환경과 장비를 고려하여 구체적인 가이드를 제공해드리겠습니다.`;
          }
          
          return {
            choices: [{
              message: {
                content: response
              }
            }],
            usage: {
              total_tokens: Math.floor(Math.random() * 100) + 50
            }
          };
        }
      }
    };
  }
}

module.exports = LLMAnswerGenerator;