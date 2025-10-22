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
   * RAG 시스템 초기화 (간소화)
   */
  async initialize() {
    if (this.initialized) return;
    
    console.log('🚀 VX RAG 시스템 초기화...');
    
    try {
      // 1. 임베딩 시스템
      this.embeddingManager = new EmbeddingManager();
      await this.embeddingManager.initializeModel();

      // 2. VX 데이터 처리
      this.dataProcessor = new VXDataProcessor();
      await this.dataProcessor.loadAllVXData();
      const chunks = await this.dataProcessor.processAllData();

      // 3. 검색 엔진
      this.hybridSearchEngine = new HybridSearchEngine(this.embeddingManager);
      this.hybridSearchEngine.setChunks(chunks);
      await this.hybridSearchEngine.precomputeEmbeddings();

      // 4. LLM 답변 생성기
      this.llmAnswerGenerator = new LLMAnswerGenerator();
      await this.llmAnswerGenerator.initialize('openai');

      this.initialized = true;
      console.log('✅ VX RAG 시스템 준비 완료!');
      
    } catch (error) {
      console.error('❌ RAG 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 질문 처리 (간소화)
   */
  async processQuery(userQuery) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // 1. 검색
      const searchResult = await this.hybridSearchEngine.searchRelevantChunks(userQuery, 3);
      
      // 2. 답변 생성
      const answerResult = await this.llmAnswerGenerator.generateAnswer(
        userQuery, 
        searchResult.chunks, 
        'general'
      );

      return {
        query: userQuery,
        answer: answerResult.answer,
        success: true
      };

    } catch (error) {
      console.error('RAG 처리 오류:', error);
      return {
        query: userQuery,
        answer: '죄송합니다. 처리 중 오류가 발생했습니다.',
        success: false
      };
    }
  }

  /**
   * 시스템 상태 (간소화)
   */
  isReady() {
    return this.initialized;
  }
}

module.exports = SimpleRAGSystem;
