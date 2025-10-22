/**
 * EmbeddingManager.js
 * VX 중계 AI - 간단한 임베딩 관리자
 * VX팀 내부 사용에 최적화된 심플한 임베딩 시스템
 */

class EmbeddingManager {
  constructor() {
    this.modelName = 'Xenova/multilingual-e5-small'; // 안정적인 다국어 모델
    this.model = null;
    this.embeddingDimension = 384;
    this.initialized = false;
    this.mockMode = false; // Mock 모드 플래그
  }

  /**
   * 임베딩 모델 초기화 (간소화)
   */
  async initializeModel() {
    try {
      console.log(`🔢 임베딩 모델 로딩: ${this.modelName}`);
      
      // ES Module 동적 import 사용
      const { pipeline } = await import('@xenova/transformers');
      
      // Vercel 환경에서 캐시 디렉토리 문제 해결
      const modelOptions = {
        cache_dir: '/tmp/transformers_cache', // Vercel에서 쓰기 가능한 /tmp 디렉토리 사용
        local_files_only: false
      };
      
      this.model = await pipeline('feature-extraction', this.modelName, modelOptions);
      
      this.initialized = true;
      console.log(`✅ 임베딩 모델 로딩 완료`);
      return true;
    } catch (error) {
      console.error(`❌ 모델 로딩 실패: ${error.message}`);
      
      // Vercel 환경에서 폴백: 더 간단한 모델 사용
      try {
        console.log('🔄 폴백 모델 시도: 더 간단한 모델 사용');
        const { pipeline } = await import('@xenova/transformers');
        this.model = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        this.initialized = true;
        console.log(`✅ 폴백 모델 로딩 완료`);
        return true;
      } catch (fallbackError) {
        console.error(`❌ 폴백 모델도 실패: ${fallbackError.message}`);
        
        // 최종 폴백: Mock 모드 활성화
        console.log('🔄 Mock 모드 활성화: 간단한 키워드 기반 유사도 계산');
        this.mockMode = true;
        this.initialized = true;
        console.log(`✅ Mock 모드 초기화 완료`);
        return true;
      }
    }
  }

  /**
   * 임베딩 생성 (간소화)
   */
  async generateEmbedding(text) {
    if (!this.initialized) {
      throw new Error('임베딩 모델이 초기화되지 않았습니다.');
    }

    // Mock 모드인 경우 키워드 기반 임베딩 생성
    if (this.mockMode) {
      return this.generateMockEmbedding(text);
    }

    try {
      const result = await this.model(text, { pooling: 'mean', normalize: true });
      return result.data;
    } catch (error) {
      console.error('임베딩 생성 오류:', error);
      throw error;
    }
  }

  /**
   * Mock 임베딩 생성 (키워드 기반)
   */
  generateMockEmbedding(text) {
    const keywords = this.extractKeywords(text);
    const embedding = new Array(this.embeddingDimension).fill(0);
    
    // 키워드별 가중치 적용
    keywords.forEach((keyword, index) => {
      const hash = this.simpleHash(keyword);
      const position = hash % this.embeddingDimension;
      embedding[position] = 1.0 / (index + 1); // 위치에 따른 가중치
    });
    
    // 정규화
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      return embedding.map(val => val / magnitude);
    }
    
    return embedding;
  }

  /**
   * 키워드 추출 (간소화)
   */
  extractKeywords(text) {
    const words = text.toLowerCase()
      .replace(/[^\w\s가-힣]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1)
      .filter(word => !['은', '는', '이', '가', '을', '를', '의', '에', '에서', '로', '으로'].includes(word));
    
    return [...new Set(words)].slice(0, 10);
  }

  /**
   * 간단한 해시 함수
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit 정수로 변환
    }
    return Math.abs(hash);
  }

  /**
   * 코사인 유사도 계산 (간소화)
   */
  calculateCosineSimilarity(embedding1, embedding2) {
    if (!embedding1 || !embedding2) return 0;
    if (embedding1.length !== embedding2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * 유사도 계산 (간소화)
   */
  async calculateSimilarity(text1, text2) {
    try {
      const embedding1 = await this.generateEmbedding(text1);
      const embedding2 = await this.generateEmbedding(text2);
      return this.calculateCosineSimilarity(embedding1, embedding2);
    } catch (error) {
      console.error('유사도 계산 오류:', error);
      return 0;
    }
  }
}

module.exports = { EmbeddingManager };