/**
 * SimpleRAGAdapter.js
 * VX 중계 AI - 심플한 Slack RAG 어댑터
 * VX팀 내부 사용에 최적화된 간단한 Slack 연동
 */

const SimpleRAGSystem = require('../core/SimpleRAGSystem');

class SimpleRAGAdapter {
  constructor() {
    this.ragSystem = new SimpleRAGSystem();
    this.initialized = false;
    this.responseCache = new Map(); // 응답 캐시
    this.cacheTimeout = 5 * 60 * 1000; // 5분 캐시
  }

  /**
   * RAG 시스템 초기화 (간소화)
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      console.log('🚀 VX RAG 시스템 초기화...');
      await this.ragSystem.initialize();
      this.initialized = true;
      console.log('✅ VX RAG 시스템 준비 완료!');
    } catch (error) {
      console.error('❌ RAG 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 메시지 처리 (간소화)
   */
  async processMessage(userMessage, userId = null) {
    if (!userMessage || !userMessage.trim()) {
      return "안녕하세요! VX 중계 관련 질문을 해주세요 🎬";
    }

    if (!this.initialized) {
      return "시스템 초기화 중입니다. 잠시 후 다시 시도해주세요.";
    }

    // 캐시 확인 (중복 답변 방지)
    const cacheKey = this.generateCacheKey(userMessage, userId);
    const cachedResponse = this.responseCache.get(cacheKey);
    if (cachedResponse && (Date.now() - cachedResponse.timestamp) < this.cacheTimeout) {
      console.log('📋 캐시된 응답 사용:', userMessage.substring(0, 50));
      return cachedResponse.response;
    }

    try {
      const response = await this.ragSystem.processQuery(userMessage);
      const formattedResponse = this.formatForSlack(response);
      
      // 응답 캐시 저장
      this.responseCache.set(cacheKey, {
        response: formattedResponse,
        timestamp: Date.now()
      });
      
      // 캐시 정리 (오래된 항목 제거)
      this.cleanupCache();
      
      return formattedResponse;
    } catch (error) {
      console.error('RAG 처리 오류:', error);
      return "죄송합니다. 처리 중 오류가 발생했습니다. 다시 시도해주세요. 🔧";
    }
  }

  /**
   * 캐시 키 생성
   */
  generateCacheKey(userMessage, userId) {
    const normalizedMessage = userMessage.toLowerCase().trim();
    return `${userId || 'anonymous'}_${normalizedMessage}`;
  }

  /**
   * 캐시 정리
   */
  cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.responseCache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.responseCache.delete(key);
      }
    }
  }

  /**
   * Slack 포맷팅 (간소화)
   */
  formatForSlack(ragResponse) {
    if (!ragResponse.answer) {
      return "관련 정보를 찾을 수 없습니다. 다른 질문을 시도해보세요.";
    }

    let message = ragResponse.answer;
    
    // Slack 마크다운 변환
    message = message
      .replace(/\*\*(.*?)\*\*/g, '*$1*')
      .replace(/📌/g, ':pushpin:')
      .replace(/⚠️/g, ':warning:')
      .replace(/💡/g, ':bulb:')
      .replace(/✅/g, ':white_check_mark:');

    // 길이 제한
    if (message.length > 3000) {
      message = message.substring(0, 3000) + '\n\n... (답변이 길어서 일부만 표시됩니다)';
    }

    return message;
  }

  /**
   * 상태 확인 (간소화)
   */
  isReady() {
    return this.initialized;
  }
}

module.exports = { SimpleRAGAdapter };