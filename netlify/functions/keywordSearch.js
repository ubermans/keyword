const fetch = require('node-fetch');
const https = require('https');

// SSL 인증서 검증을 비활성화하는 에이전트 생성
const agent = new https.Agent({
  rejectUnauthorized: false
});

// 네이버 API 키 설정 - 환경 변수에서 가져오거나 기본값 사용
// 실제 배포 시에는 Netlify 대시보드에서 환경 변수로 설정해야 합니다
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID || 'kcUpxrk46rltNyD4mp5j';
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || 'qSKhJWoktJ';

// 네이버 API 호출 시 사용할 파라미터
const NAVER_API_PARAMS = {
  display: 1,
  start: 1,
  sort: 'sim'
};

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

    // API 키 확인
    console.log(`네이버 API 키 확인 - Client ID: ${NAVER_CLIENT_ID.substring(0, 4)}... (${NAVER_CLIENT_ID.length}자)`);

    // 결과를 저장할 배열
    const results = [];

    // 각 키워드에 대해 API 호출
    for (const keyword of keywords) {
      try {
        console.log(`키워드 "${keyword}" 처리 시작`);
        
        // 네이버 API로 검색량 데이터 가져오기
        const searchVolumeData = await getSearchVolumeFromNaver(keyword);
        
        // API 호출이 성공한 경우에만 결과 추가
        results.push({
          keyword: keyword,
          total: searchVolumeData.total,
          pc: searchVolumeData.pc,
          mobile: searchVolumeData.mobile,
          source: '네이버 API' // 데이터 소스 정보 추가
        });
        
        console.log(`키워드 "${keyword}" 처리 완료 (네이버 API): 총 ${searchVolumeData.total}회 (PC: ${searchVolumeData.pc}, 모바일: ${searchVolumeData.mobile})`);
        
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

// 네이버 검색 API를 사용하여 검색량 데이터 가져오기
async function getSearchVolumeFromNaver(keyword) {
  // 네이버 검색 API 호출을 위한 헤더 설정
  const naverHeaders = {
    'X-Naver-Client-Id': NAVER_CLIENT_ID,
    'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
    'Accept': 'application/json'
  };
  
  // 금일을 제외한 최근 한 달 기간 계산
  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(today.getDate() - 30);
  
  // 날짜 형식 변환 (YYYY-MM-DD)
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const startDate = formatDate(oneMonthAgo);
  const endDate = formatDate(new Date(today.setDate(today.getDate() - 1))); // 금일 제외
  
  console.log(`검색 기간: ${startDate} ~ ${endDate} (금일 제외 최근 30일)`);
  
  try {
    // 다양한 검색 API 엔드포인트 시도
    const apiEndpoints = [
      {
        name: '웹 검색',
        url: `https://openapi.naver.com/v1/search/webkr.json?query=${encodeURIComponent(keyword)}&display=${NAVER_API_PARAMS.display}&start=${NAVER_API_PARAMS.start}&sort=${NAVER_API_PARAMS.sort}`,
        device: 'pc'
      },
      {
        name: '블로그 검색',
        url: `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(keyword)}&display=${NAVER_API_PARAMS.display}&start=${NAVER_API_PARAMS.start}&sort=${NAVER_API_PARAMS.sort}`,
        device: 'pc'
      },
      {
        name: '뉴스 검색',
        url: `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(keyword)}&display=${NAVER_API_PARAMS.display}&start=${NAVER_API_PARAMS.start}&sort=${NAVER_API_PARAMS.sort}`,
        device: 'pc'
      }
    ];
    
    // 모바일 검색 엔드포인트 추가
    const mobileEndpoints = apiEndpoints.map(endpoint => ({
      ...endpoint,
      name: `모바일 ${endpoint.name}`,
      device: 'mobile'
    }));
    
    // 모든 엔드포인트 합치기
    const allEndpoints = [...apiEndpoints, ...mobileEndpoints];
    
    // 각 엔드포인트에 대해 API 호출 시도
    const apiResults = [];
    
    // API 호출 함수 (재시도 로직 포함)
    const fetchWithRetry = async (url, options, maxRetries = 3) => {
      let lastError;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const response = await fetch(url, options);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`API 응답 오류 (시도 ${attempt}/${maxRetries}):`, response.status, response.statusText, errorText);
            
            // 401 오류인 경우 재시도하지 않음
            if (response.status === 401) {
              throw new Error(`네이버 API 인증 실패 (401): API 키가 유효하지 않거나 만료되었습니다.`);
            }
            
            // 429 오류(Too Many Requests)인 경우 더 오래 대기
            if (response.status === 429) {
              const waitTime = 1000 * attempt; // 점점 더 오래 대기
              console.log(`API 호출 제한 도달, ${waitTime}ms 대기 후 재시도...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            }
            
            throw new Error(`API 응답 오류: ${response.status} ${response.statusText}`);
          }
          
          return response;
        } catch (error) {
          console.error(`API 호출 실패 (시도 ${attempt}/${maxRetries}):`, error);
          lastError = error;
          
          // 마지막 시도가 아니면 잠시 대기 후 재시도
          if (attempt < maxRetries) {
            const waitTime = 500 * attempt; // 점점 더 오래 대기
            console.log(`${waitTime}ms 대기 후 재시도...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }
      
      // 모든 재시도 실패
      throw lastError || new Error('API 호출에 실패했습니다.');
    };
    
    for (const endpoint of allEndpoints) {
      try {
        console.log(`네이버 ${endpoint.name} API 호출: ${endpoint.url}`);
        
        const response = await fetchWithRetry(endpoint.url, {
          method: 'GET',
          headers: naverHeaders,
          agent: agent // SSL 인증서 검증 비활성화
        });
        
        const data = await response.json();
        console.log(`네이버 ${endpoint.name} API 응답:`, JSON.stringify(data).substring(0, 200) + '...');
        
        // 검색 결과 수 추출
        const total = data.total || 0;
        
        apiResults.push({
          endpoint: endpoint.name,
          device: endpoint.device,
          total: total
        });
        
        // API 호출 간 딜레이 (네이버 API 호출 제한 방지)
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`네이버 ${endpoint.name} API 호출 실패:`, error);
      }
    }
    
    // API 결과가 없으면 오류 발생
    if (apiResults.length === 0) {
      throw new Error('모든 네이버 API 호출에 실패했습니다.');
    }
    
    // PC와 모바일 검색량 계산
    const pcResults = apiResults.filter(result => result.device === 'pc');
    const mobileResults = apiResults.filter(result => result.device === 'mobile');
    
    // 가장 높은 검색량 사용
    const pcSearches = pcResults.length > 0 ? Math.max(...pcResults.map(result => result.total)) : 0;
    const mobileSearches = mobileResults.length > 0 ? Math.max(...mobileResults.map(result => result.total)) : 0;
    const total = pcSearches + mobileSearches;
    
    // 검색량이 너무 큰 경우 (API 한계) 적절한 값으로 조정
    const adjustSearchVolume = (volume) => {
      if (volume > 100000000) return Math.floor(volume / 1000); // 너무 큰 값은 조정
      return volume;
    };
    
    // 결과 로그 출력
    console.log(`키워드 "${keyword}" 검색량 결과:`, {
      total: adjustSearchVolume(total),
      pc: adjustSearchVolume(pcSearches),
      mobile: adjustSearchVolume(mobileSearches)
    });
    
    return {
      total: adjustSearchVolume(total),
      pc: adjustSearchVolume(pcSearches),
      mobile: adjustSearchVolume(mobileSearches)
    };
    
  } catch (error) {
    console.error(`네이버 검색 API 처리 중 오류 발생:`, error);
    throw error;
  }
} 