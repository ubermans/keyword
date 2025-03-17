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
        // 첫 번째 API 호출 (totalSum 없이)
        const apiUrl = `https://uy3w6h3mzi.execute-api.ap-northeast-2.amazonaws.com/Prod/hello?keyword=${encodeURIComponent(keyword)}&time=${currentTime}&device=pc&auth=mapia&source=direct`;
        
        console.log(`첫 번째 API 호출: ${apiUrl}`);
        
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
        console.log(`첫 번째 API 응답: ${JSON.stringify(data)}`);
        
        // 첫 번째 API 응답에서 검색량 추출
        let pcSearches = 0;
        let mobileSearches = 0;
        let total = 0;
        
        if (data.result) {
          pcSearches = data.result.pcSearches || 0;
          mobileSearches = data.result.mobileSearches || 0;
        } else if (data.data) {
          pcSearches = data.data.pcSearches || 0;
          mobileSearches = data.data.mobileSearches || 0;
        }
        
        total = parseInt(pcSearches) + parseInt(mobileSearches);
        
        // 검색량이 있으면 두 번째 API 호출
        if (total > 0) {
          // 두 번째 API 호출 (totalSum 포함)
          const secondApiUrl = `https://uy3w6h3mzi.execute-api.ap-northeast-2.amazonaws.com/Prod/hello?keyword=${encodeURIComponent(keyword)}&totalSum=${total}&time=${new Date().getTime()}&device=pc&auth=mapia&source=direct`;
          
          console.log(`두 번째 API 호출: ${secondApiUrl}`);
          
          const secondResponse = await fetch(secondApiUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
          
          if (secondResponse.ok) {
            const secondData = await secondResponse.json();
            console.log(`두 번째 API 응답: ${JSON.stringify(secondData)}`);
            
            // 두 번째 API 응답이 성공적이면 해당 데이터 사용
            if (secondData && secondData.status && secondData.result) {
              results.push({
                keyword: keyword,
                pc: secondData.result.pcSearches || pcSearches,
                mobile: secondData.result.mobileSearches || mobileSearches,
                total: total,
                monthBlog: secondData.result.monthlyBlogPosts || 0,
                blogSaturation: secondData.result.blogSaturation || '-',
                shopCategory: secondData.result.shopCategory || '-',
                pcClick: secondData.result.pcClicks || 0,
                mobileClick: secondData.result.mobileClicks || 0,
                pcClickRate: secondData.result.pcClickRate || '0%',
                mobileClickRate: secondData.result.mobileClickRate || '0%',
                competition: secondData.result.competition || '-',
                avgAdCount: secondData.result.avgAdExposure || 0
              });
              
              // API 호출 간 딜레이
              await new Promise(resolve => setTimeout(resolve, 500));
              return;
            }
          }
        }
        
        // 두 번째 API 호출이 실패하거나 검색량이 없는 경우, 첫 번째 결과 사용
        results.push({
          keyword: keyword,
          pc: pcSearches,
          mobile: mobileSearches,
          total: total,
          monthBlog: 0,
          blogSaturation: '-',
          shopCategory: '-',
          pcClick: 0,
          mobileClick: 0,
          pcClickRate: '0%',
          mobileClickRate: '0%',
          competition: '-',
          avgAdCount: 0
        });
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