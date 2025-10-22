/**
 * DataLoader.js
 * VX 중계 AI - 간단한 데이터 로더
 * VX JSON 데이터를 로딩하는 심플한 유틸리티
 */

const fs = require('fs').promises;
const path = require('path');

class DataLoader {
  constructor() {
    this.dataDir = path.join(__dirname, '../../data');
  }

  /**
   * JSON 파일 로딩 (간소화)
   */
  async load(filename) {
    try {
      const filePath = path.join(this.dataDir, filename);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`데이터 로딩 실패: ${filename}`, error);
      throw error;
    }
  }

  /**
   * 모든 VX 데이터 로딩 (간소화)
   */
  async loadAllVXData() {
    const files = [
      'checklists_and_faq.json',
      'equipment_list.json', 
      'locations.json',
      'obs_guide.json',
      'platforms.json',
      'zoom_guide.json'
    ];

    const data = {};
    
    for (const file of files) {
      try {
        data[file.replace('.json', '')] = await this.load(file);
        console.log(`✅ ${file} 로딩 완료`);
      } catch (error) {
        console.error(`❌ ${file} 로딩 실패:`, error.message);
      }
    }

    return data;
  }
}

module.exports = DataLoader;
