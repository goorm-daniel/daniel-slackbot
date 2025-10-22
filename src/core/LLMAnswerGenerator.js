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
   * 답변 생성 (간소화)
   */
  async generateAnswer(userQuery, retrievedChunks, questionType = 'general') {
    try {
      const context = this.buildContext(retrievedChunks);
      
      const messages = [
        {
          role: 'system',
          content: '당신은 VX팀의 중계 전문가입니다. VX팀이 보유한 장비와 환경을 기준으로 정확하고 실용적인 답변을 제공해주세요.'
        },
        {
          role: 'user',
          content: `질문: ${userQuery}\n\n관련 정보:\n${context}`
        }
      ];

      const response = await this.llmProvider.chat.completions.create({
        model: this.modelName,
        messages: messages,
        temperature: 0.3,
        max_tokens: 1000
      });

      return {
        answer: response.choices[0].message.content,
        processingTime: 0,
        questionType: questionType,
        sources: retrievedChunks.map(c => c.chunk.metadata.source),
        tokensUsed: response.usage?.total_tokens || 0
      };

    } catch (error) {
      console.error('LLM 답변 생성 오류:', error);
      
      // 폴백 답변
      return {
        answer: this.generateFallbackAnswer(userQuery, retrievedChunks),
        processingTime: 0,
        error: error.message,
        fallback: true
      };
    }
  }

  /**
   * 컨텍스트 구성 (간소화)
   */
  buildContext(retrievedChunks) {
    if (!retrievedChunks || retrievedChunks.length === 0) {
      return '관련 정보를 찾을 수 없습니다.';
    }

    return retrievedChunks.map((item, index) => 
      `${index + 1}. ${item.chunk.content}`
    ).join('\n');
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