const fetch = require('node-fetch');
const https = require('https');

// SSL 인증서 검증을 비활성화하는 에이전트 생성
const agent = new https.Agent({
  rejectUnauthorized: false
});

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
        console.log(`키워드 "${keyword}" 처리 시작`);
        
        // 현재 시간 (타임스탬프)
        const currentTime = new Date().getTime();
        
        // 마피아넷 API 호출 (첫 번째 호출)
        const firstApiUrl = `https://uy3w6h3mzi.execute-api.ap-northeast-2.amazonaws.com/Prod/hello?keyword=${encodeURIComponent(keyword)}&time=${currentTime}&device=pc&auth=mapia&source=direct`;
        
        console.log(`마피아넷 API 첫 번째 호출: ${firstApiUrl}`);
        
        // 첫 번째 API 호출
        const firstResponse = await fetch(firstApiUrl, {
          method: 'GET',
          agent: agent // SSL 인증서 검증 비활성화
        });
        
        if (!firstResponse.ok) {
          console.error(`마피아넷 API 첫 번째 호출 실패: ${firstResponse.status}, ${firstResponse.statusText}`);
          throw new Error(`마피아넷 API 요청 실패: ${firstResponse.status}`);
        }
        
        const firstData = await firstResponse.json();
        console.log(`마피아넷 API 첫 번째 응답:`, firstData);
        
        if (!firstData.status) {
          throw new Error(`마피아넷 API 응답 오류: ${firstData.message || '알 수 없는 오류'}`);
        }
        
        // 두 번째 API 호출 (totalSum 포함)
        const secondApiUrl = `https://uy3w6h3mzi.execute-api.ap-northeast-2.amazonaws.com/Prod/hello?keyword=${encodeURIComponent(keyword)}&totalSum=${firstData.result.total || 0}&time=${currentTime}&device=pc&auth=mapia&source=direct`;
        
        console.log(`마피아넷 API 두 번째 호출: ${secondApiUrl}`);
        
        const secondResponse = await fetch(secondApiUrl, {
          method: 'GET',
          agent: agent // SSL 인증서 검증 비활성화
        });
        
        if (!secondResponse.ok) {
          console.error(`마피아넷 API 두 번째 호출 실패: ${secondResponse.status}, ${secondResponse.statusText}`);
          // 두 번째 호출이 실패해도 첫 번째 호출 데이터 사용
          results.push({
            keyword: keyword,
            pc: parseInt(firstData.result.pc || 0),
            mobile: parseInt(firstData.result.mobile || 0),
            total: parseInt(firstData.result.total || 0),
            monthBlog: parseInt(firstData.result.monthBlog || 0),
            blogSaturation: firstData.result.blogSaturation || '알 수 없음',
            shopCategory: firstData.result.shopCategory || '일반',
            pcClick: parseInt(firstData.result.pcClick || 0),
            mobileClick: parseInt(firstData.result.mobileClick || 0),
            pcClickRate: firstData.result.pcClickRate || '0%',
            mobileClickRate: firstData.result.mobileClickRate || '0%',
            competition: firstData.result.competition || '알 수 없음',
            avgAdCount: parseInt(firstData.result.avgAdCount || 0)
          });
          continue;
        }
        
        const secondData = await secondResponse.json();
        console.log(`마피아넷 API 두 번째 응답:`, secondData);
        
        if (!secondData.status) {
          // 두 번째 호출이 실패해도 첫 번째 호출 데이터 사용
          results.push({
            keyword: keyword,
            pc: parseInt(firstData.result.pc || 0),
            mobile: parseInt(firstData.result.mobile || 0),
            total: parseInt(firstData.result.total || 0),
            monthBlog: parseInt(firstData.result.monthBlog || 0),
            blogSaturation: firstData.result.blogSaturation || '알 수 없음',
            shopCategory: firstData.result.shopCategory || '일반',
            pcClick: parseInt(firstData.result.pcClick || 0),
            mobileClick: parseInt(firstData.result.mobileClick || 0),
            pcClickRate: firstData.result.pcClickRate || '0%',
            mobileClickRate: firstData.result.mobileClickRate || '0%',
            competition: firstData.result.competition || '알 수 없음',
            avgAdCount: parseInt(firstData.result.avgAdCount || 0)
          });
          continue;
        }
        
        // 두 번째 API 호출 결과 사용
        results.push({
          keyword: keyword,
          pc: parseInt(secondData.result.pc || 0),
          mobile: parseInt(secondData.result.mobile || 0),
          total: parseInt(secondData.result.total || 0),
          monthBlog: parseInt(secondData.result.monthBlog || 0),
          blogSaturation: secondData.result.blogSaturation || '알 수 없음',
          shopCategory: secondData.result.shopCategory || '일반',
          pcClick: parseInt(secondData.result.pcClick || 0),
          mobileClick: parseInt(secondData.result.mobileClick || 0),
          pcClickRate: secondData.result.pcClickRate || '0%',
          mobileClickRate: secondData.result.mobileClickRate || '0%',
          competition: secondData.result.competition || '알 수 없음',
          avgAdCount: parseInt(secondData.result.avgAdCount || 0)
        });
        
        // API 호출 간 딜레이
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.error(`Error for keyword ${keyword}:`, error);
        
        // API 호출 실패 시 오류 메시지 반환
        results.push({
          keyword: keyword,
          error: `API 호출에 실패했습니다: ${error.message}`
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