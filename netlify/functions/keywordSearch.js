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

    // 마피아넷 사이트에서 사용하는 헤더 설정
    const apiHeaders = {
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      'Content-Type': 'application/json',
      'Referer': 'https://mapia.net/',
      'Origin': 'https://mapia.net',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'X-Requested-With': 'XMLHttpRequest',
      'sec-ch-ua': '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"'
    };

    // 각 키워드에 대해 API 호출
    for (const keyword of keywords) {
      try {
        console.log(`키워드 "${keyword}" 처리 시작`);
        
        // 마피아넷 사이트에서 사용하는 방식으로 API 호출
        // 1. 먼저 검색량 조회 API 호출
        const currentTime = new Date().getTime();
        const apiUrl = `https://api.mapia.net/keyword/search/volume?keyword=${encodeURIComponent(keyword)}&_=${currentTime}`;
        
        console.log(`검색량 조회 API 호출: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: apiHeaders
        });

        if (!response.ok) {
          throw new Error(`API 요청 실패: ${response.status}`);
        }

        const data = await response.json();
        console.log(`검색량 조회 API 응답:`, data);
        
        // 응답 상태 확인
        if (!data || data.status === false) {
          console.log(`키워드 "${keyword}" 응답 오류:`, data);
          results.push({
            keyword: keyword,
            error: data.message || '데이터를 가져올 수 없습니다.'
          });
          continue;
        }
        
        // 검색량 추출
        let pcSearches = 0;
        let mobileSearches = 0;
        let total = 0;
        
        if (data.data) {
          pcSearches = data.data.monthlyPcQcCnt || 0;
          mobileSearches = data.data.monthlyMobileQcCnt || 0;
          total = data.data.monthlyTotalQcCnt || 0;
        }
        
        console.log(`키워드 "${keyword}" 검색량 - PC: ${pcSearches}, Mobile: ${mobileSearches}, 합계: ${total}`);
        
        // 검색량이 있으면 추가 정보 조회 API 호출
        if (total > 0) {
          // 2. 추가 정보 조회 API 호출
          const newTime = new Date().getTime();
          const secondApiUrl = `https://api.mapia.net/keyword/search/info?keyword=${encodeURIComponent(keyword)}&_=${newTime}`;
          
          console.log(`추가 정보 조회 API 호출: ${secondApiUrl}`);
          
          const secondResponse = await fetch(secondApiUrl, {
            method: 'GET',
            headers: apiHeaders
          });
          
          if (secondResponse.ok) {
            const secondData = await secondResponse.json();
            console.log(`추가 정보 조회 API 응답:`, secondData);
            
            // 추가 정보 조회 API 응답이 성공적이면 해당 데이터 사용
            if (secondData && secondData.status && secondData.data) {
              const info = secondData.data;
              
              results.push({
                keyword: keyword,
                pc: pcSearches,
                mobile: mobileSearches,
                total: total,
                monthBlog: info.blogPostCount || 0,
                blogSaturation: info.blogSaturation || '-',
                shopCategory: info.category || '-',
                pcClick: info.pcClickCnt || 0,
                mobileClick: info.mobileClickCnt || 0,
                pcClickRate: info.pcClickRate || '0%',
                mobileClickRate: info.mobileClickRate || '0%',
                competition: info.competition || '-',
                avgAdCount: info.avgAdCnt || 0
              });
              
              // 다음 키워드로 진행
              continue;
            }
          }
        }
        
        // 추가 정보 조회 API 호출이 실패하거나 검색량이 없는 경우, 기본 결과 사용
        if (total > 0) {
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
        } else {
          results.push({
            keyword: keyword,
            error: '검색량이 없습니다.'
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