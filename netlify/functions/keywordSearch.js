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
        const apiUrl = `https://uy3w6h3mzi.execute-api.ap-northeast-2.amazonaws.com/Prod/hello?keyword=${encodeURIComponent(keyword)}&totalSum=1000&time=${currentTime}`;
        
        console.log(`API 호출: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`API 요청 실패: ${response.status}`);
        }

        const data = await response.json();
        console.log(`API 응답: ${JSON.stringify(data)}`);
        
        // API 응답 구조 확인
        if (data) {
          // 응답 구조에 따라 데이터 추출
          let pcSearches = 0;
          let mobileSearches = 0;
          let monthlyBlogPosts = 0;
          let blogSaturation = '-';
          let shopCategory = '-';
          let pcClicks = 0;
          let mobileClicks = 0;
          let pcClickRate = '0%';
          let mobileClickRate = '0%';
          let competition = '-';
          let avgAdExposure = 0;
          
          // 응답 구조에 따라 데이터 추출 로직
          if (data.result) {
            pcSearches = data.result.pcSearches || 0;
            mobileSearches = data.result.mobileSearches || 0;
            monthlyBlogPosts = data.result.monthlyBlogPosts || 0;
            blogSaturation = data.result.blogSaturation || '-';
            shopCategory = data.result.shopCategory || '-';
            pcClicks = data.result.pcClicks || 0;
            mobileClicks = data.result.mobileClicks || 0;
            pcClickRate = data.result.pcClickRate || '0%';
            mobileClickRate = data.result.mobileClickRate || '0%';
            competition = data.result.competition || '-';
            avgAdExposure = data.result.avgAdExposure || 0;
          } else if (data.data) {
            // 다른 가능한 응답 구조
            pcSearches = data.data.pcSearches || 0;
            mobileSearches = data.data.mobileSearches || 0;
            monthlyBlogPosts = data.data.monthlyBlogPosts || 0;
            blogSaturation = data.data.blogSaturation || '-';
            shopCategory = data.data.shopCategory || '-';
            pcClicks = data.data.pcClicks || 0;
            mobileClicks = data.data.mobileClicks || 0;
            pcClickRate = data.data.pcClickRate || '0%';
            mobileClickRate = data.data.mobileClickRate || '0%';
            competition = data.data.competition || '-';
            avgAdExposure = data.data.avgAdExposure || 0;
          }
          
          results.push({
            keyword: keyword,
            pc: pcSearches,
            mobile: mobileSearches,
            total: (parseInt(pcSearches) + parseInt(mobileSearches)),
            monthBlog: monthlyBlogPosts,
            blogSaturation: blogSaturation,
            shopCategory: shopCategory,
            pcClick: pcClicks,
            mobileClick: mobileClicks,
            pcClickRate: pcClickRate,
            mobileClickRate: mobileClickRate,
            competition: competition,
            avgAdCount: avgAdExposure
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
          error: '처리 중 오류가 발생했습니다: ' + error.message
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
        message: '서버 오류가 발생했습니다: ' + error.message
      })
    };
  }
}; 