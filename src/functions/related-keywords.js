const axios = require('axios');

// 네이버 API 접근 정보 (실제 운영 시에는 환경변수로 설정 필요)
const NAVER_API_KEY = 'YOUR_NAVER_API_KEY'; 
const NAVER_API_SECRET = 'YOUR_NAVER_API_SECRET';
const NAVER_API_URL = 'https://api.naver.com/keywordstool';

exports.handler = async function(event, context) {
  // CORS 헤더
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
  
  // OPTIONS 요청 처리 (CORS 프리플라이트)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS enabled' })
    };
  }
  
  // POST 요청이 아닌 경우
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }
  
  try {
    console.log('Related keyword request received:', event.body);
    
    // 요청 바디 파싱
    const body = JSON.parse(event.body);
    const { keyword } = body;
    
    console.log('Keyword received:', keyword);
    
    // 요청 데이터 유효성 검사
    if (!keyword || typeof keyword !== 'string' || keyword.trim() === '') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '유효한 키워드를 입력해주세요.' })
      };
    }

    // 더미 연관 키워드 데이터 생성
    const dummyKeywords = [
      `${keyword} 장점`,
      `${keyword} 단점`,
      `${keyword} 추천`,
      `${keyword} 가격`,
      `${keyword} 후기`,
      `${keyword} 사용법`,
      `${keyword} 비교`,
      `${keyword} 판매처`
    ];
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        results: dummyKeywords.map(kw => ({ relKeyword: kw })),
        relKeyword: keyword,
        info: "연관 키워드 검색 기능이 현재 개발 중입니다. 임시 데이터를 제공합니다."
      })
    };
    
  } catch (error) {
    console.error('연관 키워드 검색 오류:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: '서버 오류가 발생했습니다.', 
        message: error.message,
        stack: error.stack
      })
    };
  }
}; 