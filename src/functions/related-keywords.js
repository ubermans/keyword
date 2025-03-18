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

    try {
      console.log('Sending related keyword request to ma-pia.net');
      
      // 마피아넷 API 요청 파라미터
      const params = new URLSearchParams();
      params.append('keyword', keyword.trim());
      
      // 마피아넷 연관키워드 API 요청
      const response = await axios({
        method: 'post',
        url: 'https://www.ma-pia.net/keyword/recom.php',
        data: params,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
          'Origin': 'https://www.ma-pia.net',
          'Referer': 'https://www.ma-pia.net/keyword/recom.php'
        }
      });
      
      console.log('Related keyword response received');
      
      // 응답 데이터 파싱
      const html = response.data;
      
      // 디버깅을 위해 HTML 응답의 일부만 로깅
      console.log('Response preview:', html.substring(0, 300));
      
      // HTML 파싱을 위한 정규식 패턴
      const tablePattern = /<table[^>]*class="list_tbl"[^>]*>([\s\S]*?)<\/table>/i;
      const tableMatch = html.match(tablePattern);
      
      if (!tableMatch) {
        console.log('Table not found in response');
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            results: [], 
            relKeyword: keyword,
            debug: 'Table not found in HTML response'
          })
        };
      }
      
      const tableHtml = tableMatch[0];
      const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      const relatedKeywords = [];
      let rowMatch;
      
      // 첫 번째 행(헤더)은 건너뛰기
      let firstRow = true;
      
      while ((rowMatch = rowPattern.exec(tableHtml)) !== null) {
        if (firstRow) {
          firstRow = false;
          continue;
        }
        
        const cellPattern = /<td[^>]*>([\s\S]*?)<\/td>/gi;
        const cells = [];
        let cellMatch;
        
        while ((cellMatch = cellPattern.exec(rowMatch[0])) !== null) {
          cells.push(cellMatch[1].replace(/<[^>]*>/g, '').trim());
        }
        
        if (cells.length >= 1) {
          relatedKeywords.push(cells[0]);
        }
      }
      
      console.log(`Parsed ${relatedKeywords.length} related keywords`);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          results: relatedKeywords.map(kw => ({ relKeyword: kw })),
          relKeyword: keyword
        })
      };
      
    } catch (apiError) {
      console.error('마피아넷 API 요청 오류:', apiError);
      
      // API 요청에 실패한 경우 더미 데이터 반환
      console.log('Returning dummy related keyword data');
      
      // 예시 관련 키워드 생성
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
          usingDummyData: true,
          error: apiError.message
        })
      };
    }
    
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