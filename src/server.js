const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 네이버 API 엔드포인트 설정 (실제로는 네이버 API를 직접 호출해야 합니다)
const NAVER_API_URL = 'https://api.naver.com/keywordstool';

// 키워드 검색 API 라우트
app.post('/api/keyword', async (req, res) => {
  try {
    const { keywords } = req.body;
    
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({ error: '유효한 키워드를 입력해주세요.' });
    }

    // TODO: 실제 구현에서는 네이버 API 키와 인증 정보가 필요합니다
    // 여기서는 예시 데이터를 반환합니다
    const results = keywords.map(keyword => ({
      keyword,
      pcMonthlyQcCnt: Math.floor(Math.random() * 10000),
      mobileMonthlyQcCnt: Math.floor(Math.random() * 20000),
      totalMonthlyQcCnt: Math.floor(Math.random() * 30000),
      competitionIndex: (Math.random() * 0.9 + 0.1).toFixed(2),
      compIdx: ['낮음', '보통', '높음'][Math.floor(Math.random() * 3)]
    }));

    res.json({ results });
  } catch (error) {
    console.error('키워드 검색 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 연관 키워드 API 라우트
app.post('/api/related-keywords', async (req, res) => {
  try {
    const { keyword } = req.body;
    
    if (!keyword || typeof keyword !== 'string') {
      return res.status(400).json({ error: '유효한 키워드를 입력해주세요.' });
    }

    // 예시 연관 키워드 데이터 생성
    const relatedKeywords = [];
    const baseKeywords = [
      '방법', '추천', '리뷰', '가격', '비교', '후기', 
      '종류', '사용법', '효과', '구매', '무료', '최저가'
    ];
    
    for (const suffix of baseKeywords) {
      relatedKeywords.push({
        relKeyword: `${keyword} ${suffix}`,
        pcMonthlyQcCnt: Math.floor(Math.random() * 5000),
        mobileMonthlyQcCnt: Math.floor(Math.random() * 10000),
        totalMonthlyQcCnt: Math.floor(Math.random() * 15000),
        competitionIndex: (Math.random() * 0.9 + 0.1).toFixed(2),
        compIdx: ['낮음', '보통', '높음'][Math.floor(Math.random() * 3)]
      });
    }

    res.json({ results: relatedKeywords });
  } catch (error) {
    console.error('연관 키워드 검색 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다`);
});

// Netlify 함수로 사용하기 위한 내보내기
module.exports = app; 