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
          for (const [itemName, details] of Object.entries(items)) {
            if (details && details.수량) {
              const description = this.createEquipmentDescription(itemName, details, category);
              chunks.push({
                id: `equipment_${category}_${itemName}`,
                content: description,
                metadata: {
                  source: 'equipment_list',
                  category: category,
                  itemType: itemName,
                  keywords: this.extractKeywords(description)
                }
              });
            }
          }
        }
      }
    }

    return chunks;
  }

  /**
   * 장소 데이터 처리 (간소화)
   */
  processLocationsData() {
    const chunks = [];
    const locationsData = this.allVXData.locations;

    for (const [locationKey, locationInfo] of Object.entries(locationsData)) {
      if (locationInfo.이름) {
        const description = `${locationInfo.이름}: ${locationInfo.설명}`;
        chunks.push({
          id: `location_${locationKey}`,
          content: description,
          metadata: {
            source: 'locations',
            location: locationKey,
            keywords: this.extractKeywords(description)
          }
        });
      }
    }

    return chunks;
  }

  /**
   * 체크리스트 데이터 처리 (간소화)
   */
  processChecklistsData() {
    const chunks = [];
    const checklistData = this.allVXData.checklists_and_faq;

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

    return chunks;
  }

  /**
   * OBS 데이터 처리 (간소화)
   */
  processOBSData() {
    const chunks = [];
    const obsData = this.allVXData.obs_guide;

    for (const [section, content] of Object.entries(obsData)) {
      if (typeof content === 'object') {
        const description = `${section}: ${JSON.stringify(content).substring(0, 200)}...`;
        chunks.push({
          id: `obs_${section}`,
          content: description,
          metadata: {
            source: 'obs_guide',
            section: section,
            keywords: this.extractKeywords(description)
          }
        });
      }
    }

    return chunks;
  }

  /**
   * 플랫폼 데이터 처리 (간소화)
   */
  processPlatformsData() {
    const chunks = [];
    const platformsData = this.allVXData.platforms;

    for (const [platform, content] of Object.entries(platformsData)) {
      if (typeof content === 'object') {
        const description = `${platform} 플랫폼: ${JSON.stringify(content).substring(0, 200)}...`;
        chunks.push({
          id: `platform_${platform}`,
          content: description,
          metadata: {
            source: 'platforms',
            platform: platform,
            keywords: this.extractKeywords(description)
          }
        });
      }
    }

    return chunks;
  }

  /**
   * Zoom 데이터 처리 (간소화)
   */
  processZoomData() {
    const chunks = [];
    const zoomData = this.allVXData.zoom_guide;

    for (const [section, content] of Object.entries(zoomData)) {
      if (typeof content === 'object') {
        const description = `Zoom ${section}: ${JSON.stringify(content).substring(0, 200)}...`;
        chunks.push({
          id: `zoom_${section}`,
          content: description,
          metadata: {
            source: 'zoom_guide',
            section: section,
            keywords: this.extractKeywords(description)
          }
        });
      }
    }

    return chunks;
  }

  /**
   * 장비 설명 생성 (간소화)
   */
  createEquipmentDescription(itemName, details, category) {
    let description = `${itemName}은(는) ${category} 장비입니다.`;
    
    if (details.수량) {
      description += ` VX팀에서 ${details.수량}대를 보유하고 있습니다.`;
    }
    
    if (details.상태) {
      description += ` 현재 상태는 ${details.상태}입니다.`;
    }
    
    if (details.스펙) {
      description += ` 주요 스펙: ${details.스펙}`;
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