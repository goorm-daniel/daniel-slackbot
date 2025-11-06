/**
 * VXDataProcessor.js
 * VX 중계 AI - 간단한 데이터 처리기
 * VX JSON 데이터를 자연어 청크로 변환하는 심플한 프로세서
 */

const DataLoader = require('../utils/DataLoader');

class VXDataProcessor {
  constructor() {
    this.dataLoader = new DataLoader();
    this.allVXData = {};
  }

  /**
   * 모든 VX 데이터 로딩 (간소화)
   */
  async loadAllVXData() {
    console.log('📁 VX 데이터 로딩 시작...');
    this.allVXData = await this.dataLoader.loadAllVXData();
    console.log('✅ VX 데이터 로딩 완료');
    return this.allVXData;
  }

  /**
   * 데이터 처리 (간소화)
   */
  async processAllData() {
    console.log('🔧 VX 데이터 청킹 시작...');
    const chunks = [];

    // equipment_list 처리
    if (this.allVXData.equipment_list) {
      chunks.push(...this.processEquipmentData());
    }

    // locations 처리
    if (this.allVXData.locations) {
      chunks.push(...this.processLocationsData());
    }

    // checklists_and_faq 처리
    if (this.allVXData.checklists_and_faq) {
      chunks.push(...this.processChecklistsData());
    }

    // obs_guide 처리
    if (this.allVXData.obs_guide) {
      chunks.push(...this.processOBSData());
    }

    // platforms 처리
    if (this.allVXData.platforms) {
      chunks.push(...this.processPlatformsData());
    }

    // zoom_guide 처리
    if (this.allVXData.zoom_guide) {
      chunks.push(...this.processZoomData());
    }

    console.log(`✅ 총 ${chunks.length}개 청크 생성 완료`);
    return chunks;
  }

  /**
   * 장비 데이터 처리 (간소화)
   */
  processEquipmentData() {
    const chunks = [];
    const equipmentData = this.allVXData.equipment_list;

    if (equipmentData.VX팀장비관리) {
      for (const [category, items] of Object.entries(equipmentData.VX팀장비관리)) {
        if (typeof items === 'object') {
          // 3단계 중첩 구조 처리: 카테고리 > 하위카테고리 > 장비
          for (const [subCategory, subItems] of Object.entries(items)) {
            if (typeof subItems === 'object') {
              for (const [itemName, details] of Object.entries(subItems)) {
                if (details && details.수량) {
                  const description = this.createEquipmentDescription(itemName, details, category, subCategory);
                  chunks.push({
                    id: `equipment_${category}_${subCategory}_${itemName}`,
                    content: description,
                    metadata: {
                      source: 'equipment_list',
                      category: category,
                      subCategory: subCategory,
                      itemType: itemName,
                      keywords: this.extractKeywords(description)
                    }
                  });
                }
              }
            }
          }
        }
      }
    }

    return chunks;
  }

  /**
   * 장소 데이터 처리 (구조화된 정보 자연어 변환)
   */
  processLocationsData() {
    const chunks = [];
    const locationsData = this.allVXData.locations;

    for (const [locationKey, locationInfo] of Object.entries(locationsData)) {
      if (!locationInfo || typeof locationInfo !== 'object') continue;

      const locationName = locationInfo.이름 || locationKey;
      const baseDescription = locationInfo.설명 || '';

      // 기본 장소 정보 청크
      let mainDescription = `${locationName} ${baseDescription}`;
      if (locationInfo.상세가이드링크) {
        mainDescription += ` 상세 가이드: ${locationInfo.상세가이드링크}`;
      }
      
      chunks.push({
        id: `location_${locationKey}_main`,
        content: mainDescription,
        metadata: {
          source: 'locations',
          location: locationKey,
          locationName: locationName,
          type: 'main',
          keywords: this.extractKeywords(mainDescription)
        }
      });

      // 세부 기능별 청크 생성
      for (const [featureKey, featureData] of Object.entries(locationInfo)) {
        // 기본 정보 필드는 제외
        if (['이름', '설명', '상세가이드링크'].includes(featureKey)) continue;

        if (typeof featureData === 'object' && featureData !== null) {
          const featureDescription = this.createLocationFeatureDescription(
            locationName,
            featureKey,
            featureData
          );

          if (featureDescription) {
            chunks.push({
              id: `location_${locationKey}_${featureKey}`,
              content: featureDescription,
              metadata: {
                source: 'locations',
                location: locationKey,
                locationName: locationName,
                feature: featureKey,
                type: 'feature',
                keywords: this.extractKeywords(featureDescription)
              }
            });
          }
        }
      }
    }

    return chunks;
  }

  /**
   * 장소 기능 설명 생성 (재귀적 처리)
   */
  createLocationFeatureDescription(locationName, featureKey, featureData, depth = 0) {
    if (depth > 3) return null; // 깊이 제한
    
    const descriptions = [];
    const featureDisplayName = this.translateFeatureKey(featureKey);

    // 설명이 있으면 추가
    if (featureData.설명) {
      descriptions.push(`${locationName}의 ${featureDisplayName}: ${featureData.설명}`);
    }

    // 배열 처리
    if (Array.isArray(featureData)) {
      const steps = featureData.map((item, index) => `${index + 1}. ${item}`).join('\n');
      descriptions.push(`${locationName}의 ${featureDisplayName}:\n${steps}`);
      return descriptions.join('\n\n');
    }

    // 객체 처리 (재귀)
    if (typeof featureData === 'object' && featureData !== null) {
      for (const [key, value] of Object.entries(featureData)) {
        if (key === '설명') continue;

        if (Array.isArray(value)) {
          const label = this.translateFeatureKey(key);
          const items = value.map((item, index) => {
            if (typeof item === 'object') {
              return this.createLocationFeatureDescription(locationName, key, item, depth + 1);
            }
            return `${index + 1}. ${item}`;
          }).join('\n');
          descriptions.push(`${label}:\n${items}`);
        } else if (typeof value === 'object' && value !== null) {
          const nested = this.createLocationFeatureDescription(locationName, key, value, depth + 1);
          if (nested) descriptions.push(nested);
        } else if (typeof value === 'string') {
          descriptions.push(`${this.translateFeatureKey(key)}: ${value}`);
        }
      }
    }

    return descriptions.length > 0 ? descriptions.join('\n\n') : null;
  }

  /**
   * 기능 키 한글 변환
   */
  translateFeatureKey(key) {
    const translations = {
      '빔프로젝터연결': '빔프로젝터 연결',
      '온오프라인동시중계': '온오프라인 동시 중계',
      '사운드세팅': '사운드 세팅',
      '단상노트북세팅': '단상 노트북 세팅',
      '카메라세팅': '카메라 세팅',
      '오디오세팅': '오디오 세팅',
      '13층사운드사용법': '13층 사운드 사용법',
      '14층타운홀사용법': '14층 타운홀 사용법',
      '사운드믹서사용법': '사운드 믹서 사용법',
      'PTZ카메라사용법': 'PTZ 카메라 사용법',
      '연결방법': '연결 방법',
      '설정방법': '설정 방법',
      '주의사항': '주의사항',
      '해결방법': '해결방법'
    };
    return translations[key] || key;
  }

  /**
   * 체크리스트 데이터 처리 (FAQ 포함)
   */
  processChecklistsData() {
    const chunks = [];
    const checklistData = this.allVXData.checklists_and_faq;

    // 중계 준비 체크리스트 처리
    if (checklistData.중계준비체크리스트) {
      const checklist = checklistData.중계준비체크리스트;
      let description = '중계 준비 체크리스트:\n';
      
      // 공통기본준비사항
      if (checklist.공통기본준비사항 && Array.isArray(checklist.공통기본준비사항)) {
        description += '\n공통 기본 준비사항:\n';
        checklist.공통기본준비사항.forEach((item, index) => {
          description += `${index + 1}. ${item}\n`;
        });
      }
      
      // 온라인중계시추가
      if (checklist.온라인중계시추가 && Array.isArray(checklist.온라인중계시추가)) {
        description += '\n온라인 중계 시 추가사항:\n';
        checklist.온라인중계시추가.forEach((item, index) => {
          description += `${index + 1}. ${item}\n`;
        });
      }
      
      chunks.push({
        id: 'checklist_preparation',
        content: description,
        metadata: {
          source: 'checklists_and_faq',
          type: 'checklist',
          keywords: this.extractKeywords(description)
        }
      });
    }

    // FAQ 데이터 처리
    if (checklistData.자주묻는질문FAQ) {
      const faqData = checklistData.자주묻는질문FAQ;

      // 각 카테고리별로 처리
      for (const [category, categoryItems] of Object.entries(faqData)) {
        if (typeof categoryItems !== 'object') continue;

        // 카테고리 내 각 질문-답변 쌍 처리
        for (const [questionKey, questionData] of Object.entries(categoryItems)) {
          if (typeof questionData !== 'object' || !questionData) continue;

          const faqDescription = this.createFAQDescription(category, questionKey, questionData);
          
          if (faqDescription) {
            chunks.push({
              id: `faq_${category}_${questionKey}`,
              content: faqDescription,
              metadata: {
                source: 'checklists_and_faq',
                type: 'faq',
                category: category,
                questionKey: questionKey,
                keywords: this.extractKeywords(faqDescription)
              }
            });
          }
        }
      }
    }

    return chunks;
  }

  /**
   * FAQ 설명 생성
   */
  createFAQDescription(category, questionKey, questionData) {
    const descriptions = [];
    const categoryName = this.translateFAQCategory(category);
    
    // 문제/질문 제목
    let questionTitle = questionData.문제 || 
                        questionData.문제상황 || 
                        questionData.질문 || 
                        questionKey;
    
    descriptions.push(`[${categoryName}] ${questionTitle}`);

    // 해결방법 처리
    if (questionData.해결방법) {
      const solutions = Array.isArray(questionData.해결방법) 
        ? questionData.해결방법 
        : [questionData.해결방법];
      
      solutions.forEach((solution, index) => {
        if (typeof solution === 'string') {
          descriptions.push(`해결방법 ${index + 1}: ${solution}`);
        } else if (typeof solution === 'object') {
          // 객체 형태의 해결방법 (단계별)
          if (solution.조건) descriptions.push(`조건: ${solution.조건}`);
          if (solution.방법) {
            const methods = Array.isArray(solution.방법) ? solution.방법 : [solution.방법];
            descriptions.push(`방법:\n${methods.map((m, i) => `${i + 1}. ${m}`).join('\n')}`);
          }
        }
      });
    }

    // 원인 처리
    if (questionData.원인) {
      const causes = Array.isArray(questionData.원인) ? questionData.원인 : [questionData.원인];
      descriptions.push(`원인: ${causes.join(', ')}`);
    }

    // 설정경로/설정방법 처리
    if (questionData.설정경로 || questionData.설정방법) {
      const settings = questionData.설정경로 || questionData.설정방법;
      if (typeof settings === 'object' && !Array.isArray(settings)) {
        // OS별 설정 (Windows, macOS 등)
        for (const [os, steps] of Object.entries(settings)) {
          const stepList = Array.isArray(steps) ? steps : [steps];
          descriptions.push(`${os} 설정 방법:\n${stepList.map((s, i) => `${i + 1}. ${s}`).join('\n')}`);
        }
      } else {
        const stepList = Array.isArray(settings) ? settings : [settings];
        descriptions.push(`설정 방법:\n${stepList.map((s, i) => `${i + 1}. ${s}`).join('\n')}`);
      }
    }

    // 단계별 체크리스트
    if (questionData.단계별체크리스트) {
      const checklist = questionData.단계별체크리스트;
      for (const [stepKey, stepData] of Object.entries(checklist)) {
        if (stepData.질문) descriptions.push(`${stepKey}: ${stepData.질문}`);
        if (stepData.선택지) descriptions.push(`선택지: ${stepData.선택지.join(', ')}`);
        if (stepData.조건) descriptions.push(`조건: ${stepData.조건}`);
        if (stepData.해결방법) {
          const methods = Array.isArray(stepData.해결방법) ? stepData.해결방법 : [stepData.해결방법];
          descriptions.push(`해결방법:\n${methods.map((m, i) => `${i + 1}. ${m}`).join('\n')}`);
        }
        if (stepData.안내멘트) descriptions.push(`안내: ${stepData.안내멘트}`);
      }
    }

    // 참고사항
    if (questionData.참고사항) {
      const notes = Array.isArray(questionData.참고사항) 
        ? questionData.참고사항 
        : [questionData.참고사항];
      descriptions.push(`참고사항:\n${notes.map((n, i) => `${i + 1}. ${n}`).join('\n')}`);
    }

    // 추가 확인 항목
    if (questionData.추가확인) descriptions.push(`추가 확인: ${questionData.추가확인}`);
    if (questionData.특별주의) descriptions.push(`특별 주의: ${questionData.특별주의}`);

    return descriptions.length > 0 ? descriptions.join('\n\n') : null;
  }

  /**
   * FAQ 카테고리 한글 변환
   */
  translateFAQCategory(category) {
    const translations = {
      '연결관련': '연결 관련',
      'OBS관련': 'OBS 관련',
      '화면관련문제': '화면 관련 문제',
      '노트북연결시화면인식문제': '노트북 연결 시 화면 인식 문제',
      '강남교육장맥북연결문제': '강남 교육장 맥북 연결 문제'
    };
    return translations[category] || category;
  }

  /**
   * OBS 데이터 처리 (구조화된 정보 자연어 변환)
   */
  processOBSData() {
    const chunks = [];
    const obsData = this.allVXData.obs_guide;

    for (const [section, content] of Object.entries(obsData)) {
      if (typeof content !== 'object' || !content) continue;

      // 각 섹션별로 자연어 변환
      const description = this.createOBSGuideDescription(section, content);
      
      if (description) {
        chunks.push({
          id: `obs_${section}`,
          content: description,
          metadata: {
            source: 'obs_guide',
            section: section,
            type: 'guide',
            keywords: this.extractKeywords(description)
          }
        });
      }

      // 섹션 내 세부 항목도 별도 청크로 생성
      for (const [subsection, subcontent] of Object.entries(content)) {
        if (typeof subcontent === 'object' && subcontent !== null && !Array.isArray(subcontent)) {
          const subDescription = this.createOBSGuideDescription(
            `${section} - ${subsection}`,
            subcontent
          );
          
          if (subDescription) {
            chunks.push({
              id: `obs_${section}_${subsection}`,
              content: subDescription,
              metadata: {
                source: 'obs_guide',
                section: section,
                subsection: subsection,
                type: 'subsection',
                keywords: this.extractKeywords(subDescription)
              }
            });
          }
        }
      }
    }

    return chunks;
  }

  /**
   * OBS 가이드 설명 생성
   */
  createOBSGuideDescription(title, content, depth = 0) {
    if (depth > 3) return null;
    
    const descriptions = [];
    
    // 설명 필드 처리
    if (content.설명) {
      descriptions.push(`${title}: ${content.설명}`);
    }

    // 배열 필드 처리
    const arrayFields = ['방법', '생성방법', '접근경로', '설정방법', '추가방법', '예시장면', '주요소스유형', '주요기능', '설정옵션', '주요효과', '사용방법', '설정예시', '해결방법', '권장설정', '참고사항', '주의사항'];
    
    for (const field of arrayFields) {
      if (content[field]) {
        const items = Array.isArray(content[field]) ? content[field] : [content[field]];
        const label = this.translateOBSField(field);
        
        items.forEach((item, index) => {
          if (typeof item === 'object') {
            // 객체 배열인 경우 (예: 주요기능)
            const itemDesc = this.createOBSGuideDescription(`${label} ${index + 1}`, item, depth + 1);
            if (itemDesc) descriptions.push(itemDesc);
          } else if (typeof item === 'string') {
            descriptions.push(`${label}: ${item}`);
          }
        });
      }
    }

    // 객체 필드 처리 (재귀)
    for (const [key, value] of Object.entries(content)) {
      if (['설명', ...arrayFields].includes(key)) continue;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const nested = this.createOBSGuideDescription(`${title} - ${key}`, value, depth + 1);
        if (nested) descriptions.push(nested);
      } else if (Array.isArray(value)) {
        const label = this.translateOBSField(key);
        const items = value.map((item, idx) => {
          if (typeof item === 'object') {
            return this.createOBSGuideDescription(`${label} ${idx + 1}`, item, depth + 1);
          }
          return `${idx + 1}. ${item}`;
        }).filter(Boolean).join('\n');
        if (items) descriptions.push(`${label}:\n${items}`);
      } else if (typeof value === 'string') {
        descriptions.push(`${this.translateOBSField(key)}: ${value}`);
      }
    }

    return descriptions.length > 0 ? descriptions.join('\n\n') : null;
  }

  /**
   * OBS 필드 한글 변환
   */
  translateOBSField(field) {
    const translations = {
      '방법': '방법',
      '생성방법': '생성 방법',
      '접근경로': '접근 경로',
      '설정방법': '설정 방법',
      '추가방법': '추가 방법',
      '예시장면': '예시 장면',
      '주요소스유형': '주요 소스 유형',
      '주요기능': '주요 기능',
      '설정옵션': '설정 옵션',
      '주요효과': '주요 효과',
      '사용방법': '사용 방법',
      '설정예시': '설정 예시',
      '해결방법': '해결 방법',
      '권장설정': '권장 설정',
      '참고사항': '참고사항',
      '주의사항': '주의사항'
    };
    return translations[field] || field;
  }

  /**
   * 플랫폼 데이터 처리 (구조화된 정보 자연어 변환)
   */
  processPlatformsData() {
    const chunks = [];
    const platformsData = this.allVXData.platforms;

    for (const [platform, content] of Object.entries(platformsData)) {
      if (typeof content !== 'object' || !content) continue;

      const description = this.createPlatformDescription(platform, content);
      
      if (description) {
        chunks.push({
          id: `platform_${platform}`,
          content: description,
          metadata: {
            source: 'platforms',
            platform: platform,
            type: 'guide',
            keywords: this.extractKeywords(description)
          }
        });
      }
    }

    return chunks;
  }

  /**
   * 플랫폼 설명 생성
   */
  createPlatformDescription(platform, content, depth = 0) {
    if (depth > 3) return null;
    
    const descriptions = [];
    
    // 설명 필드
    if (content.설명) {
      descriptions.push(`${platform} 플랫폼: ${content.설명}`);
    }

    // 모든 필드를 자연어로 변환
    for (const [key, value] of Object.entries(content)) {
      if (key === '설명') continue;
      
      if (Array.isArray(value)) {
        const label = key;
        descriptions.push(`${label}:\n${value.map((item, i) => `${i + 1}. ${item}`).join('\n')}`);
      } else if (typeof value === 'object' && value !== null) {
        const nested = this.createPlatformDescription(`${platform} - ${key}`, value, depth + 1);
        if (nested) descriptions.push(nested);
      } else if (typeof value === 'string') {
        descriptions.push(`${key}: ${value}`);
      }
    }

    return descriptions.length > 0 ? descriptions.join('\n\n') : null;
  }

  /**
   * Zoom 데이터 처리 (구조화된 정보 자연어 변환)
   */
  processZoomData() {
    const chunks = [];
    const zoomData = this.allVXData.zoom_guide;

    for (const [section, content] of Object.entries(zoomData)) {
      if (typeof content !== 'object' || !content) continue;

      const description = this.createZoomGuideDescription(section, content);
      
      if (description) {
        chunks.push({
          id: `zoom_${section}`,
          content: description,
          metadata: {
            source: 'zoom_guide',
            section: section,
            type: 'guide',
            keywords: this.extractKeywords(description)
          }
        });
      }

      // 세부 항목도 별도 청크로 생성
      for (const [subsection, subcontent] of Object.entries(content)) {
        if (typeof subcontent === 'object' && subcontent !== null) {
          const subDescription = this.createZoomGuideDescription(
            `${section} - ${subsection}`,
            subcontent
          );
          
          if (subDescription) {
            chunks.push({
              id: `zoom_${section}_${subsection}`,
              content: subDescription,
              metadata: {
                source: 'zoom_guide',
                section: section,
                subsection: subsection,
                type: 'subsection',
                keywords: this.extractKeywords(subDescription)
              }
            });
          }
        }
      }
    }

    return chunks;
  }

  /**
   * Zoom 가이드 설명 생성
   */
  createZoomGuideDescription(title, content, depth = 0) {
    if (depth > 3) return null;
    
    const descriptions = [];
    
    // 설명 필드
    if (content.설명) {
      descriptions.push(`Zoom ${title}: ${content.설명}`);
    }

    // 배열 필드 처리
    const arrayFields = ['방법', '설정방법', '문제상황', '원인', '해결방법', '주의사항', '확인사항'];
    
    for (const field of arrayFields) {
      if (content[field]) {
        const items = Array.isArray(content[field]) ? content[field] : [content[field]];
        const label = this.translateZoomField(field);
        
        if (field === '방법' || field === '설정방법' || field === '해결방법') {
          descriptions.push(`${label}:\n${items.map((item, i) => `${i + 1}. ${item}`).join('\n')}`);
        } else {
          descriptions.push(`${label}: ${items.join(', ')}`);
        }
      }
    }

    // 객체 필드 처리 (재귀)
    for (const [key, value] of Object.entries(content)) {
      if (['설명', ...arrayFields].includes(key)) continue;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const nested = this.createZoomGuideDescription(`${title} - ${key}`, value, depth + 1);
        if (nested) descriptions.push(nested);
      } else if (typeof value === 'string') {
        descriptions.push(`${this.translateZoomField(key)}: ${value}`);
      }
    }

    return descriptions.length > 0 ? descriptions.join('\n\n') : null;
  }

  /**
   * Zoom 필드 한글 변환
   */
  translateZoomField(field) {
    const translations = {
      '방법': '방법',
      '설정방법': '설정 방법',
      '문제상황': '문제 상황',
      '원인': '원인',
      '해결방법': '해결 방법',
      '주의사항': '주의사항',
      '확인사항': '확인사항',
      '기능': '기능'
    };
    return translations[field] || field;
  }

  /**
   * 장비 설명 생성 (간소화)
   */
  createEquipmentDescription(itemName, details, category, subCategory) {
    let description = `${itemName}은(는) VX팀이 보유한 ${category}의 ${subCategory} 장비입니다.`;
    
    if (details.수량) {
      description += ` 현재 ${details.수량}대를 보유하고 있습니다.`;
    }
    
    if (details.상태) {
      description += ` 모든 장비가 ${details.상태} 상태입니다.`;
    }
    
    if (details.시리얼넘버 && details.시리얼넘버.length > 0) {
      description += ` 시리얼번호: ${details.시리얼넘버.join(', ')}`;
    }
    
    if (details.구성품 && details.구성품.length > 0) {
      description += ` 구성품: ${details.구성품.join(', ')}`;
    }
    
    if (details.스펙) {
      description += ` 주요 스펙: ${details.스펙}`;
    }
    
    if (details.비고) {
      description += ` 비고: ${details.비고}`;
    }
    
    return description;
  }

  /**
   * 키워드 추출 (간소화)
   */
  extractKeywords(text) {
    const keywords = [];
    const commonWords = ['은', '는', '이', '가', '을', '를', '의', '에', '에서', '로', '으로'];
    
    const words = text.split(/\s+/).filter(word => 
      word.length > 1 && !commonWords.includes(word)
    );
    
    return [...new Set(words)].slice(0, 10);
  }
}

module.exports = VXDataProcessor;