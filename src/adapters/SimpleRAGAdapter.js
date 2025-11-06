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
   * 메시지 처리 (중복 방지 강화)
   */
  async processMessage(userMessage, userId = null, eventId = null) {
    if (!userMessage || !userMessage.trim()) {
      return "안녕하세요! VX 중계 관련 질문을 해주세요 🎬";
    }

    if (!this.initialized) {
      return "시스템 초기화 중입니다. 잠시 후 다시 시도해주세요.";
    }

    // 캐시 확인 (중복 답변 방지) - eventId도 포함
    const cacheKey = this.generateCacheKey(userMessage, userId, eventId);
    const cachedResponse = this.responseCache.get(cacheKey);
    if (cachedResponse && (Date.now() - cachedResponse.timestamp) < this.cacheTimeout) {
      console.log('📋 캐시된 응답 사용:', userMessage.substring(0, 50), 'eventId:', eventId);
      return cachedResponse.response;
    }

    // 동일한 질문이 최근에 처리되었는지 확인 (1분 이내)
    const recentCacheKey = this.generateCacheKey(userMessage, userId);
    const recentResponse = this.responseCache.get(recentCacheKey);
    if (recentResponse && (Date.now() - recentResponse.timestamp) < 60 * 1000) {
      console.log('⚠️ 최근 처리된 질문, 동일 응답 반환:', userMessage.substring(0, 50));
      return recentResponse.response;
    }

    try {
      const response = await this.ragSystem.processQuery(userMessage);
      const formattedResponse = this.formatForSlack(response);
      
      // 응답 캐시 저장 (eventId 포함)
      this.responseCache.set(cacheKey, {
        response: formattedResponse,
        timestamp: Date.now()
      });
      
      // 일반 캐시도 저장 (최근 질문 확인용)
      if (recentCacheKey !== cacheKey) {
        this.responseCache.set(recentCacheKey, {
          response: formattedResponse,
          timestamp: Date.now()
        });
      }
      
      // 캐시 정리 (오래된 항목 제거)
      this.cleanupCache();
      
      return formattedResponse;
    } catch (error) {
      console.error('RAG 처리 오류:', error);
      return "죄송합니다. 처리 중 오류가 발생했습니다. 다시 시도해주세요. 🔧";
    }
  }

  /**
   * 캐시 키 생성 (eventId 포함)
   */
  generateCacheKey(userMessage, userId, eventId = null) {
    const normalizedMessage = userMessage.toLowerCase().trim();
    const baseKey = `${userId || 'anonymous'}_${normalizedMessage}`;
    
    if (eventId) {
      return `${baseKey}_${eventId}`;
    }
    
    return baseKey;
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
   * Slack 포맷팅 (간결화 + 데이터 검증)
   */
  formatForSlack(ragResponse) {
    let answer = ragResponse.answer || '답변을 생성할 수 없습니다.';
    
    // 데이터 기반 답변이 아닌 경우 경고 추가
    if (ragResponse.dataSourced === false) {
      return `⚠️ ${answer}`;
    }
    
    // 폴백 답변인 경우 표시
    if (ragResponse.fallback) {
      answer = `📋 ${answer}`;
    }
    
    // Slack 마크다운 변환 (최소화)
    answer = answer
      .replace(/\*\*(.*?)\*\*/g, '*$1*');

    // 길이 제한 (더 짧게)
    if (answer.length > 2000) {
      answer = answer.substring(0, 2000) + '\n\n... (답변이 길어서 일부만 표시됩니다)';
    }

    return answer;
  }

  /**
   * 상태 확인 (간소화)
   */
  isReady() {
    return this.initialized;
  }
}

module.exports = { SimpleRAGAdapter };