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
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
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
    // 요청 바디 파싱
    const body = JSON.parse(event.body);
    const { keyword } = body;
    
    // 요청 데이터 유효성 검사
    if (!keyword || typeof keyword !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '유효한 키워드를 입력해주세요.' })
      };
    }
    
    // 실제 API 호출 시에는 아래 주석을 해제하고 사용
    /*
    // 네이버 API 요청
    const response = await axios.post(NAVER_API_URL, {
      hintKeywords: [keyword],
      showDetail: 1
    }, {
      headers: {
        'X-Naver-Client-Id': NAVER_API_KEY,
        'X-Naver-Client-Secret': NAVER_API_SECRET,
        'Content-Type': 'application/json'
      }
    });
    
    // 응답 처리
    const apiData = response.data;
    // 연관 키워드 추출 및 처리 로직 구현 필요
    */
    
    // 예시 연관 키워드 데이터 생성 (실제 구현 시에는 위 주석 코드 사용)
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
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ results: relatedKeywords })
    };
    
  } catch (error) {
    console.error('연관 키워드 검색 오류:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: '서버 오류가 발생했습니다.' })
    };
  }
}; 