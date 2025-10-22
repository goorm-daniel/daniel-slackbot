/**
 * HybridSearchEngine.js
 * VX 중계 AI - 간단한 하이브리드 검색 엔진
 * VX팀 내부 사용에 최적화된 심플한 검색 시스템
 */

class HybridSearchEngine {
  constructor(embeddingManager) {
    this.embeddingManager = embeddingManager;
    this.chunks = [];
    this.chunkEmbeddings = [];
  }

  /**
   * 청크 설정 (간소화)
   */
  setChunks(chunks) {
    this.chunks = chunks;
  }

  /**
   * 임베딩 미리 계산 (간소화)
   */
  async precomputeEmbeddings() {
    console.log('🔢 청크 임베딩 미리 계산 시작...');
    
    for (let i = 0; i < this.chunks.length; i++) {
      const embedding = await this.embeddingManager.generateEmbedding(this.chunks[i].content);
      this.chunkEmbeddings[i] = embedding;
    }
    
    console.log(`✅ ${this.chunks.length}개 청크 임베딩 계산 완료`);
  }

  /**
   * 하이브리드 검색 (간소화)
   */
  async searchRelevantChunks(userQuery, topK = 3) {
    try {
      // 1. 벡터 검색
      const vectorScores = await this.calculateVectorScores(userQuery);
      
      // 2. 키워드 검색
      const keywordScores = this.calculateKeywordScores(userQuery);
      
      // 3. 점수 결합 (간단한 평균)
      const combinedScores = vectorScores.map((vScore, i) => 
        (vScore + keywordScores[i]) / 2
      );
      
      // 4. Top-K 선택
      const topChunks = this.selectTopChunks(combinedScores, topK);
      
      return {
        chunks: topChunks,
        scores: {
          vector: vectorScores,
          keyword: keywordScores,
          combined: combinedScores
        }
      };
      
    } catch (error) {
      console.error('검색 오류:', error);
      return { chunks: [], scores: { vector: [], keyword: [], combined: [] } };
    }
  }

  /**
   * 벡터 점수 계산 (간소화)
   */
  async calculateVectorScores(userQuery) {
    const queryEmbedding = await this.embeddingManager.generateEmbedding(userQuery);
    const scores = [];
    
    for (let i = 0; i < this.chunkEmbeddings.length; i++) {
      const similarity = this.embeddingManager.calculateCosineSimilarity(
        queryEmbedding, 
        this.chunkEmbeddings[i]
      );
      scores.push(similarity);
    }
    
    return scores;
  }

  /**
   * 키워드 점수 계산 (간소화)
   */
  calculateKeywordScores(userQuery) {
    const queryLower = userQuery.toLowerCase();
    const scores = [];
    
    for (const chunk of this.chunks) {
      let score = 0;
      const contentLower = chunk.content.toLowerCase();
      
      // 키워드 매칭
      const queryWords = queryLower.split(/\s+/);
      for (const word of queryWords) {
        if (word.length > 1 && contentLower.includes(word)) {
          score += 1;
        }
      }
      
      // 청크 키워드와 매칭
      if (chunk.metadata.keywords) {
        for (const keyword of chunk.metadata.keywords) {
          if (queryLower.includes(keyword.toLowerCase())) {
            score += 2;
          }
        }
      }
      
      scores.push(score);
    }
    
    return scores;
  }

  /**
   * Top-K 청크 선택 (간소화)
   */
  selectTopChunks(scores, topK) {
    const indexedScores = scores.map((score, index) => ({ score, index }));
    indexedScores.sort((a, b) => b.score - a.score);
    
    return indexedScores.slice(0, topK).map(item => ({
      chunk: this.chunks[item.index],
      score: item.score
    }));
  }
}

module.exports = HybridSearchEngine;