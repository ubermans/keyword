const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // OPTIONS 요청 처리
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // POST 요청 확인
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ 
          status: 'error', 
          message: '잘못된 요청 방식입니다.' 
        })
      };
    }

    // 요청 데이터 파싱
    const { keywords } = JSON.parse(event.body);
    
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          status: 'error', 
          message: '올바른 키워드 형식이 아닙니다.' 
        })
      };
    }

    // 결과를 저장할 배열
    const results = [];

    // 각 키워드에 대해 API 호출
    for (const keyword of keywords) {
      try {
        const currentTime = new Date().getTime();
        const response = await fetch(
          `https://uy3w6h3mzi.execute-api.ap-northeast-2.amazonaws.com/Prod/hello?keyword=${encodeURIComponent(keyword)}&currentTime=${currentTime}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error(`API 요청 실패: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && data.status === 'success') {
          results.push({
            keyword: keyword,
            pc: data.pc || 0,
            mobile: data.mobile || 0,
            total: (parseInt(data.pc || 0) + parseInt(data.mobile || 0)),
            monthBlog: data.monthBlog || 0,
            blogSaturation: data.blogSaturation || '-',
            shopCategory: data.shopCategory || '-',
            pcClick: data.pcClick || 0,
            mobileClick: data.mobileClick || 0,
            pcClickRate: data.pcClickRate || '0%',
            mobileClickRate: data.mobileClickRate || '0%',
            competition: data.competition || '-',
            avgAdCount: data.avgAdCount || 0
          });
        } else {
          results.push({
            keyword: keyword,
            error: '데이터를 가져올 수 없습니다.'
          });
        }

        // API 호출 간 딜레이
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error for keyword ${keyword}:`, error);
        results.push({
          keyword: keyword,
          error: '처리 중 오류가 발생했습니다.'
        });
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'success',
        results: results
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: 'error',
        message: '서버 오류가 발생했습니다.'
      })
    };
  }
}; 