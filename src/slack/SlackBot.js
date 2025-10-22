/**
 * SlackBot.js
 * VX 중계 AI - 심플한 Slack 봇
 * VX팀 내부 사용에 최적화된 간단한 Slack 봇
 */

const express = require('express');
const { WebClient } = require('@slack/web-api');
require('dotenv').config();

const { SimpleRAGAdapter } = require('../adapters/SimpleRAGAdapter');

class SlackBot {
  constructor() {
    this.app = express();
    this.slack = new WebClient(process.env.SLACK_BOT_TOKEN);
    this.ragAdapter = new SimpleRAGAdapter();
    this.port = process.env.PORT || 3000;
  }

  /**
   * 봇 시작 (간소화)
   */
  async start() {
    try {
      console.log('🚀 VX RAG 시스템 초기화...');
      await this.ragAdapter.initialize();
      console.log('✅ VX RAG 시스템 준비 완료!');

      this.setupRoutes();
      this.startServer();
      
    } catch (error) {
      console.error('❌ RAG 초기화 실패:', error);
      console.log('🔄 기본 모드로 시작합니다...');
      this.setupRoutes();
      this.startServer();
    }
  }

  /**
   * 라우트 설정 (간소화)
   */
  setupRoutes() {
    this.app.use(express.json());

    // 기본 상태 확인
    this.app.get('/', (req, res) => {
      res.json({
        message: '🤖 VX 중계팀 AI 봇 (RAG 업그레이드)',
        status: 'running',
        ragReady: this.ragAdapter.isReady()
      });
    });

    // Slack 이벤트 처리
    this.app.post('/slack/events', async (req, res) => {
      try {
        // URL 검증
        if (req.body.type === 'url_verification') {
          return res.send(req.body.challenge);
        }

        // 이벤트 처리
        if (req.body.type === 'event_callback') {
          const event = req.body.event;
          
          if (event.type === 'app_mention' && !event.bot_id) {
            const question = event.text.replace(/<@[^>]+>/g, '').trim();
            
            if (question) {
              const response = await this.ragAdapter.processMessage(question, event.user);
              
              await this.slack.chat.postMessage({
                channel: event.channel,
                text: response,
                thread_ts: event.ts
              });
            } else {
              await this.slack.chat.postMessage({
                channel: event.channel,
                text: '안녕하세요! VX 중계 관련 질문을 해주세요 🎬',
                thread_ts: event.ts
              });
            }
          }
        }

        res.status(200).send('OK');
      } catch (error) {
        console.error('Slack 이벤트 처리 오류:', error);
        res.status(500).send('Error');
      }
    });
  }

  /**
   * 서버 시작 (간소화)
   */
  startServer() {
    this.app.listen(this.port, () => {
      console.log('🚀 VX 중계팀 AI 봇이 시작되었습니다!');
      console.log(`📡 포트: ${this.port}`);
      console.log('🔗 Slack 이벤트 URL: http://localhost:3000/slack/events');
      console.log('💡 Slack에서 @봇이름으로 멘션해보세요!');
    });
  }
}

// 직접 실행 시
if (require.main === module) {
  const bot = new SlackBot();
  bot.start().catch(console.error);
}

module.exports = SlackBot;
