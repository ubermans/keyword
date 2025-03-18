const axios = require('axios');
const FormData = require('form-data');

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
    const { keywords } = body;
    
    // 요청 데이터 유효성 검사
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '유효한 키워드를 입력해주세요.' })
      };
    }
    
    if (keywords.length > 100) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '키워드는 최대 100개까지 입력 가능합니다.' })
      };
    }

    // FormData 생성
    const formData = new FormData();
    formData.append('keyword', keywords.join(','));
    formData.append('type', '1');

    // 마피아넷 API 요청
    const response = await axios.post('https://www.ma-pia.net/keyword/keyword.php', formData, {
      headers: {
        ...formData.getHeaders(),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    // 응답 데이터 파싱
    const html = response.data;
    
    // HTML 파싱을 위한 정규식 패턴
    const keywordPattern = /<tr[^>]*>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<\/tr>/g;
    
    const results = [];
    let match;
    
    while ((match = keywordPattern.exec(html)) !== null) {
      results.push({
        keyword: match[1].trim(),
        pcMonthlyQcCnt: parseInt(match[2].replace(/,/g, '')),
        mobileMonthlyQcCnt: parseInt(match[3].replace(/,/g, '')),
        totalMonthlyQcCnt: parseInt(match[4].replace(/,/g, '')),
        competitionIndex: parseFloat(match[5]),
        compIdx: match[6].trim()
      });
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ results })
    };
    
  } catch (error) {
    console.error('키워드 검색 오류:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: '서버 오류가 발생했습니다.' })
    };
  }
}; 