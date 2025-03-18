const axios = require('axios');
const cheerio = require('cheerio');

exports.handler = async function(event, context) {
  // CORS 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // OPTIONS 요청 처리 (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // POST 요청이 아닌 경우 거부
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // 요청 본문에서 키워드 가져오기
    const { keyword } = JSON.parse(event.body);
    
    if (!keyword) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Keyword is required' })
      };
    }

    // 마피아넷 요청
    const response = await axios({
      method: 'post',
      url: 'https://www.ma-pia.net/keyword/keyword.php',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      data: `keyword=${encodeURIComponent(keyword)}`
    });

    // HTML 파싱
    const $ = cheerio.load(response.data);
    const results = [];

    // 테이블 데이터 추출
    $('table tr').each((i, element) => {
      if (i === 0) return; // 헤더 행 제외
      
      const row = $(element);
      const data = {
        keyword: row.find('td:nth-child(1)').text().trim(),
        searchVolume: row.find('td:nth-child(2)').text().trim(),
        competition: row.find('td:nth-child(3)').text().trim(),
        // 필요한 다른 컬럼들도 추가
      };
      results.push(data);
    });

    // 성공 응답
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(results)
    };
    
  } catch (error) {
    console.log('Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal Server Error', 
        message: error.message 
      })
    };
  }
}; 