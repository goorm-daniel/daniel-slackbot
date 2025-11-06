/**
 * SimpleRAGSystem.js
 * VX 중계 AI - 심플한 RAG 시스템
 * VX팀 내부 사용에 최적화된 간단한 RAG 시스템
 */

const { EmbeddingManager } = require('../utils/EmbeddingManager');
const VXDataProcessor = require('../processors/VXDataProcessor');
const HybridSearchEngine = require('./HybridSearchEngine');
const LLMAnswerGenerator = require('./LLMAnswerGenerator');

class SimpleRAGSystem {
  constructor() {
    this.embeddingManager = null;
    this.dataProcessor = null;
    this.hybridSearchEngine = null;
    this.llmAnswerGenerator = null;
    this.initialized = false;
  }

  /**
   * RAG 시스템 초기화 (타임아웃 처리 + 진행 상황 로깅)
   */
  async initialize() {
    if (this.initialized) {
      console.log('✅ RAG 시스템 이미 초기화됨');
      return;
    }
    
    const initStartTime = Date.now();
    console.log('🚀 VX RAG 시스템 초기화 시작...');
    
    try {
      // 1. 임베딩 시스템 (타임아웃 적용)
      console.log('📦 [1/4] 임베딩 시스템 초기화 중...');
      this.embeddingManager = new EmbeddingManager();
      await this.embeddingManager.initializeModel();
      console.log(`✅ [1/4] 임베딩 시스템 초기화 완료 (${Date.now() - initStartTime}ms)`);

      // 2. VX 데이터 처리
      console.log('📦 [2/4] VX 데이터 처리 중...');
      this.dataProcessor = new VXDataProcessor();
      await this.dataProcessor.loadAllVXData();
      const chunks = await this.dataProcessor.processAllData();
      console.log(`✅ [2/4] VX 데이터 처리 완료: ${chunks.length}개 청크 생성 (${Date.now() - initStartTime}ms)`);

      // 3. 검색 엔진 (임베딩 사전 계산은 선택적)
      console.log('📦 [3/4] 검색 엔진 초기화 중...');
      this.hybridSearchEngine = new HybridSearchEngine(this.embeddingManager);
      this.hybridSearchEngine.setChunks(chunks);
      
      // Mock 모드가 아니고 청크가 적으면 임베딩 사전 계산 (선택적)
      if (!this.embeddingManager.mockMode && chunks.length < 500) {
        console.log('📦 임베딩 사전 계산 중... (청크 수가 적어서 가능)');
        try {
          await Promise.race([
            this.hybridSearchEngine.precomputeEmbeddings(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('임베딩 사전 계산 타임아웃')), 30000))
          ]);
          console.log('✅ 임베딩 사전 계산 완료');
        } catch (embeddingError) {
          console.warn('⚠️ 임베딩 사전 계산 타임아웃/오류 - 필요시 실시간 계산으로 진행:', embeddingError.message);
          // 임베딩 사전 계산 실패해도 계속 진행
        }
      } else {
        console.log('ℹ️ 임베딩 사전 계산 건너뜀 (Mock 모드 또는 청크가 많음)');
      }
      console.log(`✅ [3/4] 검색 엔진 초기화 완료 (${Date.now() - initStartTime}ms)`);

      // 4. LLM 답변 생성기
      console.log('📦 [4/4] LLM 답변 생성기 초기화 중...');
      this.llmAnswerGenerator = new LLMAnswerGenerator();
      await this.llmAnswerGenerator.initialize('openai');
      console.log(`✅ [4/4] LLM 답변 생성기 초기화 완료 (${Date.now() - initStartTime}ms)`);

      this.initialized = true;
      const totalTime = Date.now() - initStartTime;
      console.log(`✅ VX RAG 시스템 준비 완료! (총 ${totalTime}ms)`);
      
    } catch (error) {
      const totalTime = Date.now() - initStartTime;
      console.error(`❌ RAG 초기화 실패 (${totalTime}ms):`, error);
      console.error('스택 트레이스:', error.stack);
      
      // 최소한의 폴백 모드로라도 동작하도록
      if (!this.embeddingManager || !this.embeddingManager.initialized) {
        console.log('🔄 최소 폴백 모드 활성화 시도...');
        try {
          this.embeddingManager = new EmbeddingManager();
          this.embeddingManager.mockMode = true;
          this.embeddingManager.initialized = true;
          console.log('✅ 최소 폴백 모드 활성화 완료');
        } catch (fallbackError) {
          console.error('❌ 폴백 모드 활성화도 실패:', fallbackError);
        }
      }
      
      throw error;
    }
  }

  /**
   * 질문 처리 (검색 품질 검증 + 간결화)
   */
  async processQuery(userQuery) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // 1. 검색 (랜덤성 추가)
      const searchResult = await this.hybridSearchEngine.searchRelevantChunks(
        userQuery, 
        3 + Math.floor(Math.random() * 2) // 3-4개 청크 랜덤 선택
      );
      
      // 2. 검색 품질 확인
      if (searchResult.quality === 'insufficient' || searchResult.quality === 'failed') {
        return {
          query: userQuery,
          answer: "죄송합니다. VX 데이터에서 관련 정보를 찾을 수 없습니다. 더 구체적인 질문을 해주시거나 VX팀에 직접 문의해주세요.",
          dataSourced: false,
          success: true,
          confidence: 0,
          timestamp: Date.now()
        };
      }
      
      // 3. 답변 생성
      const answerResult = await this.llmAnswerGenerator.generateAnswer(
        userQuery, 
        searchResult.chunks, 
        'general'
      );

      // 4. 답변 품질 검증
      const finalAnswer = this.validateAndFormat(answerResult, userQuery);

      return {
        query: userQuery,
        answer: finalAnswer.answer,
        dataSourced: answerResult.dataSourced !== false,
        success: true,
        confidence: answerResult.confidence || 0.8,
        fallback: answerResult.fallback,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('RAG 처리 오류:', error);
      return {
        query: userQuery,
        answer: '죄송합니다. 처리 중 오류가 발생했습니다.',
        dataSourced: false,
        success: false,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 답변 검증 및 포맷팅
   */
  validateAndFormat(answerResult, userQuery) {
    let answer = answerResult.answer;

    // 답변 길이 제한 (간결성 강제)
    const lines = answer.split('\n').filter(line => line.trim());
    if (lines.length > 10) {
      // 10줄 이상이면 핵심만 추출
      answer = lines.slice(0, 8).join('\n') + '\n\n...더 자세한 정보가 필요하면 구체적으로 질문해주세요.';
    }

    // 불필요한 서론 제거
    const unnecessaryPhrases = [
      '안녕하세요',
      '감사합니다',
      '도움이 되었기를 바랍니다',
      '추가 질문이 있으시면'
    ];
    
    unnecessaryPhrases.forEach(phrase => {
      answer = answer.replace(new RegExp(phrase + '.*?\\.', 'gi'), '');
    });

    return {
      answer: answer.trim(),
      validated: true
    };
  }

  /**
   * 답변에 랜덤성 추가
   */
  addVariationToAnswer(answer, query) {
    const variations = [
      'VX팀의 경험을 바탕으로',
      '실제 중계 환경을 고려하여',
      'VX팀이 보유한 장비 기준으로',
      '중계 전문가 관점에서',
      'VX팀의 노하우를 바탕으로'
    ];
    
    const randomVariation = variations[Math.floor(Math.random() * variations.length)];
    
    // 답변 시작 부분에 랜덤 프리픽스 추가
    if (!answer.includes(randomVariation)) {
      return `${randomVariation} 안내드리겠습니다.\n\n${answer}`;
    }
    
    return answer;
  }

  /**
   * 시스템 상태 (간소화)
   */
  isReady() {
    return this.initialized;
  }
}

module.exports = SimpleRAGSystem;
