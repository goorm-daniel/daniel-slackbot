/**
 * EmbeddingManager.js
 * VX 중계 AI - 간단한 임베딩 관리자
 * VX팀 내부 사용에 최적화된 심플한 임베딩 시스템
 */

const { pipeline } = require('@xenova/transformers');

class EmbeddingManager {
  constructor() {
    this.modelName = 'Xenova/multilingual-e5-small'; // 안정적인 다국어 모델
    this.model = null;
    this.embeddingDimension = 384;
    this.initialized = false;
  }

  /**
   * 임베딩 모델 초기화 (간소화)
   */
  async initializeModel() {
    try {
      console.log(`🔢 임베딩 모델 로딩: ${this.modelName}`);
      this.model = await pipeline('feature-extraction', this.modelName);
      this.initialized = true;
      console.log(`✅ 임베딩 모델 로딩 완료`);
      return true;
    } catch (error) {
      console.error(`❌ 모델 로딩 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 임베딩 생성 (간소화)
   */
  async generateEmbedding(text) {
    if (!this.initialized) {
      throw new Error('임베딩 모델이 초기화되지 않았습니다.');
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