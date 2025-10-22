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
   * 하이브리드 검색 (검증 강화)
   */
  async searchRelevantChunks(userQuery, topK = 3) {
    try {
      // 1. 벡터 검색
      const vectorScores = await this.calculateVectorScores(userQuery);
      
      // 2. 키워드 검색
      const keywordScores = this.calculateKeywordScores(userQuery);
      
      // 3. 점수 결합 (벡터 60%, 키워드 40%)
      const combinedScores = vectorScores.map((vScore, i) => 
        (vScore * 0.6) + (keywordScores[i] * 0.4)
      );
      
      // 4. Top-K 선택
      const topChunks = this.selectTopChunks(combinedScores, topK);
      
      // 5. 검색 품질 검증
      const quality = this.assessSearchQuality(topChunks, userQuery);
      
      return {
        chunks: topChunks,
        quality: quality,
        scores: {
          vector: vectorScores,
          keyword: keywordScores,
          combined: combinedScores
        }
      };
      
    } catch (error) {
      console.error('검색 오류:', error);
      return { 
        chunks: [], 
        quality: 'failed',
        scores: { vector: [], keyword: [], combined: [] } 
      };
    }
  }

  /**
   * 검색 품질 평가
   */
  assessSearchQuality(topChunks, userQuery) {
    if (!topChunks || topChunks.length === 0) {
      return 'insufficient';
    }

    // 최고 점수 확인
    const topScore = topChunks[0]?.score || 0;

    // 질문에서 키워드 추출
    const queryKeywords = this.extractQueryKeywords(userQuery);
    
    // 검색된 청크에서 키워드 일치 확인
    let keywordMatchCount = 0;
    topChunks.forEach(chunk => {
      const chunkText = chunk.chunk.content.toLowerCase();
      queryKeywords.forEach(keyword => {
        if (chunkText.includes(keyword.toLowerCase())) {
          keywordMatchCount++;
        }
      });
    });

    // 품질 판단
    if (topScore >= 0.5 && keywordMatchCount >= 2) {
      return 'excellent';
    } else if (topScore >= 0.3 || keywordMatchCount >= 1) {
      return 'good';
    } else if (topScore >= 0.2) {
      return 'fair';
    } else {
      return 'insufficient';
    }
  }

  /**
   * 질문에서 키워드 추출
   */
  extractQueryKeywords(query) {
    const keywords = [];
    const vxTerms = [
      'a7s3', 'fx3', '소니', 'sony', '카메라', '렌즈', 'obs', 'zoom',
      '강남', '판교', '카카오테크', '중계', '방송', '촬영', '장비',
      'uwp-d21', '마이크', '조명', 'aputure', '삼각대', '맥북',
      '캡처보드', '문제', '해결', '설정', '연결', '준비'
    ];

    const queryLower = query.toLowerCase();
    vxTerms.forEach(term => {
      if (queryLower.includes(term)) {
        keywords.push(term);
      }
    });

    return keywords;
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
   * 키워드 점수 계산 (VX 전문용어 강화)
   */
  calculateKeywordScores(userQuery) {
    const queryLower = userQuery.toLowerCase();
    const scores = [];
    
    // VX 전문용어 키워드
    const vxKeywords = this.getVXKeywords();
    
    for (const chunk of this.chunks) {
      let score = 0;
      const contentLower = chunk.content.toLowerCase();
      
      // 1. 질문 단어 매칭 (기본 점수)
      const queryWords = queryLower.split(/\s+/).filter(w => w.length > 1);
      for (const word of queryWords) {
        if (contentLower.includes(word)) {
          score += 0.5;
        }
      }
      
      // 2. 청크 메타데이터 키워드 매칭 (중요도 높음)
      if (chunk.metadata.keywords) {
        for (const keyword of chunk.metadata.keywords) {
          if (queryLower.includes(keyword.toLowerCase())) {
            score += 1.5;
          }
        }
      }
      
      // 3. VX 전문용어 매칭 (가장 중요)
      for (const term of vxKeywords) {
        if (queryLower.includes(term.toLowerCase()) && contentLower.includes(term.toLowerCase())) {
          score += 2.0;
        }
      }
      
      // 4. 카테고리별 추가 점수
      if (queryLower.includes('촬영') || queryLower.includes('장비')) {
        if (chunk.metadata.category === '촬영장비') {
          score += 1.0;
        }
      }
      
      if (queryLower.includes('카메라')) {
        if (chunk.metadata.subCategory === '카메라') {
          score += 2.0; // 카메라 질문 시 카메라 청크 우선
        }
      }
      
      if (queryLower.includes('문제') || queryLower.includes('해결')) {
        if (chunk.metadata.source === 'checklists_and_faq') {
          score += 1.5;
        }
      }
      
      scores.push(score);
    }
    
    return scores;
  }

  /**
   * VX 전문용어 키워드 목록
   */
  getVXKeywords() {
    return [
      // 카메라
      'A7S3', 'FX3', '오즈모포켓3', '소니', 'Sony', '카메라',
      // 렌즈
      'SEL16-35GM', 'SEL24-70GM2', 'SEL85F1.4GM', '렌즈',
      // 조명
      'Aputure', 'LS600x', 'C300D', 'C300X', '조명',
      // 오디오
      'UWP-D21', '무선핀마이크', 'ZOOM H8', '마이크',
      // 삼각대
      '삼각대', 'VT3500', 'Sachtler',
      // 장소
      '강남', '판교', '카카오테크', '구름스퀘어', '타운홀',
      // 소프트웨어
      'OBS', 'Zoom', '옵스', '줌',
      // 장비
      '맥북', '캡처보드', 'ATEM',
      // 기타
      'VX', 'vx', '중계', '방송', '촬영', '장비'
    ];
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