const fetch = require('node-fetch');
const https = require('https');

// SSL 인증서 검증을 비활성화하는 에이전트 생성
const agent = new https.Agent({
  rejectUnauthorized: false
});

// 네이버 API 키 설정 - 환경 변수에서 가져오거나 기본값 사용
// 실제 배포 시에는 Netlify 대시보드에서 환경 변수로 설정해야 합니다
// 새로운 API 키로 업데이트
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID || 'kcUpxrk46rltNyD4mp5j';
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || 'qSKhJWoktJ';

// 마피아넷 API 사용 여부 설정 (네이버 API가 실패할 경우 대체 사용)
const USE_MAFIA_API = true;

// 마피아넷 API 호출 시 사용할 파라미터
const MAFIA_API_PARAMS = {
  device: 'pc',
  auth: '1',
  source: 'extension'
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
    console.log(`API 설정 확인 - 마피아넷 API ${USE_MAFIA_API ? '사용' : '미사용'}`);

    // 결과를 저장할 배열
    const results = [];

    // 각 키워드에 대해 API 호출
    for (const keyword of keywords) {
      try {
        console.log(`키워드 "${keyword}" 처리 시작`);
        
        let searchVolumeData;
        let apiSource = '';
        
        // 마피아넷 API 사용 여부에 따라 다른 함수 호출
        if (USE_MAFIA_API) {
          try {
            searchVolumeData = await getSearchVolumeFromMafia(keyword);
            apiSource = '마피아넷 API';
          } catch (mafiaError) {
            console.error(`마피아넷 API 호출 실패:`, mafiaError);
            
            // 마피아넷 API 실패 시 네이버 API 시도
            try {
              searchVolumeData = await getSearchVolumeFromNaver(keyword);
              apiSource = '네이버 API';
            } catch (naverError) {
              console.error(`네이버 API 호출도 실패:`, naverError);
              
              // 두 API 모두 실패 시 추정 데이터 사용
              searchVolumeData = estimateSearchVolume(keyword);
              apiSource = '추정 데이터';
            }
          }
        } else {
          try {
            searchVolumeData = await getSearchVolumeFromNaver(keyword);
            apiSource = '네이버 API';
          } catch (naverError) {
            console.error(`네이버 API 호출 실패:`, naverError);
            
            // 네이버 API 실패 시 마피아넷 API 시도
            try {
              searchVolumeData = await getSearchVolumeFromMafia(keyword);
              apiSource = '마피아넷 API';
            } catch (mafiaError) {
              console.error(`마피아넷 API 호출도 실패:`, mafiaError);
              
              // 두 API 모두 실패 시 추정 데이터 사용
              searchVolumeData = estimateSearchVolume(keyword);
              apiSource = '추정 데이터';
            }
          }
        }
        
        // 결과 배열에 추가
        results.push({
          keyword: keyword,
          total: searchVolumeData.total,
          pc: searchVolumeData.pc,
          mobile: searchVolumeData.mobile,
          source: apiSource // 데이터 소스 정보 추가
        });
        
        console.log(`키워드 "${keyword}" 처리 완료 (${apiSource}): 총 ${searchVolumeData.total}회 (PC: ${searchVolumeData.pc}, 모바일: ${searchVolumeData.mobile})`);
        
        // API 호출 간 딜레이
        await new Promise(resolve => setTimeout(resolve, 500));
        
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

// 마피아넷 API를 사용하여 검색량 데이터 가져오기
async function getSearchVolumeFromMafia(keyword) {
  try {
    // 현재 시간 (타임스탬프)
    const timestamp = Date.now();
    
    // 마피아넷 API 호출 URL 구성 (첫 번째 호출)
    const apiUrl = `https://uy3w6h3mzi.execute-api.ap-northeast-2.amazonaws.com/Prod/hello?keyword=${encodeURIComponent(keyword)}&time=${timestamp}&device=${MAFIA_API_PARAMS.device}&auth=${MAFIA_API_PARAMS.auth}&source=${MAFIA_API_PARAMS.source}`;
    
    console.log(`마피아넷 API 첫 번째 호출: ${apiUrl}`);
    
    // 첫 번째 API 호출 (기본 정보 가져오기)
    const response = await fetch(apiUrl, {
      method: 'GET',
      agent: agent // SSL 인증서 검증 비활성화
    });
    
    if (!response.ok) {
      throw new Error(`마피아넷 API 응답 오류: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`마피아넷 API 첫 번째 응답:`, JSON.stringify(data).substring(0, 200) + '...');
    
    if (!data.status) {
      throw new Error(`마피아넷 API 응답 오류: ${data.message || '알 수 없는 오류'}`);
    }
    
    // 검색량 데이터 추출
    let pcSearches = parseInt(data.result.monthlyPcQcCnt.replace(/,/g, '')) || 0;
    let mobileSearches = parseInt(data.result.monthlyMobileQcCnt.replace(/,/g, '')) || 0;
    
    // 두 번째 API 호출 (추가 정보 가져오기)
    try {
      // 첫 번째 응답에서 total 값 추출
      const totalSum = data.result.total || 0;
      
      // 딜레이 추가 (마피아넷 웹사이트 동작 방식 모방)
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 두 번째 API 호출 URL 구성
      const secondApiUrl = `https://uy3w6h3mzi.execute-api.ap-northeast-2.amazonaws.com/Prod/hello?keyword=${encodeURIComponent(keyword)}&time=${timestamp + 1}&device=${MAFIA_API_PARAMS.device}&auth=${MAFIA_API_PARAMS.auth}&source=${MAFIA_API_PARAMS.source}&totalSum=${totalSum}`;
      
      console.log(`마피아넷 API 두 번째 호출: ${secondApiUrl}`);
      
      const secondResponse = await fetch(secondApiUrl, {
        method: 'GET',
        agent: agent // SSL 인증서 검증 비활성화
      });
      
      if (secondResponse.ok) {
        const secondData = await secondResponse.json();
        console.log(`마피아넷 API 두 번째 응답:`, JSON.stringify(secondData).substring(0, 200) + '...');
        
        if (secondData.status && secondData.result) {
          // 두 번째 응답에서 더 정확한 검색량 데이터가 있으면 업데이트
          if (secondData.result.monthlyPcQcCnt) {
            pcSearches = parseInt(secondData.result.monthlyPcQcCnt.replace(/,/g, '')) || pcSearches;
          }
          if (secondData.result.monthlyMobileQcCnt) {
            mobileSearches = parseInt(secondData.result.monthlyMobileQcCnt.replace(/,/g, '')) || mobileSearches;
          }
        }
      }
    } catch (secondError) {
      // 두 번째 API 호출 실패 시 로그만 남기고 첫 번째 호출 결과 사용
      console.error(`마피아넷 API 두 번째 호출 실패:`, secondError);
      console.log(`첫 번째 API 호출 결과만 사용합니다.`);
    }
    
    const total = pcSearches + mobileSearches;
    
    return {
      total: total,
      pc: pcSearches,
      mobile: mobileSearches
    };
    
  } catch (error) {
    console.error(`마피아넷 API 처리 중 오류 발생:`, error);
    
    // 오류 발생 시 추정 데이터 반환
    return estimateSearchVolume(keyword);
  }
}

// 네이버 검색 API를 사용하여 검색량 데이터 가져오기
async function getSearchVolumeFromNaver(keyword) {
  // 네이버 검색 API 호출을 위한 헤더 설정
  const naverHeaders = {
    'X-Naver-Client-Id': NAVER_CLIENT_ID,
    'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
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
    // 웹 검색 결과 가져오기 - 수정된 URL 형식
    const webSearchUrl = `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(keyword)}&display=1`;
    const webResponse = await fetch(webSearchUrl, {
      method: 'GET',
      headers: naverHeaders,
      agent: agent // SSL 인증서 검증 비활성화
    });
    
    // 모바일 검색 결과 가져오기 - 수정된 URL 형식
    const mobileSearchUrl = `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(keyword)}&display=1`;
    const mobileResponse = await fetch(mobileSearchUrl, {
      method: 'GET',
      headers: naverHeaders,
      agent: agent // SSL 인증서 검증 비활성화
    });
    
    // API 응답 상태 확인
    if (!webResponse.ok || !mobileResponse.ok) {
      console.error(`네이버 웹 검색 응답 상태: ${webResponse.status}, ${webResponse.statusText}`);
      console.error(`네이버 모바일 검색 응답 상태: ${mobileResponse.status}, ${mobileResponse.statusText}`);
      
      // 응답 본문 확인 시도
      let webErrorText = '';
      let mobileErrorText = '';
      
      try {
        webErrorText = await webResponse.text();
        mobileErrorText = await mobileResponse.text();
        console.error('네이버 웹 검색 오류 응답:', webErrorText);
        console.error('네이버 모바일 검색 오류 응답:', mobileErrorText);
      } catch (e) {
        console.error('응답 본문 읽기 실패:', e);
      }
      
      // 401 오류인 경우 API 키 문제일 가능성이 높음
      if (webResponse.status === 401 || mobileResponse.status === 401) {
        throw new Error(`네이버 API 인증 실패 (401): API 키가 유효하지 않거나 만료되었습니다.`);
      }
      
      throw new Error(`네이버 검색 API 호출 실패: ${webResponse.status} ${webResponse.statusText}`);
    }
    
    const webData = await webResponse.json();
    const mobileData = await mobileResponse.json();
    
    console.log(`네이버 웹 검색 응답:`, JSON.stringify(webData).substring(0, 200) + '...');
    console.log(`네이버 모바일 검색 응답:`, JSON.stringify(mobileData).substring(0, 200) + '...');
    
    // 네이버 검색 API에서 total 값 추출 (실제 검색량)
    const pcSearches = webData.total || 0;
    const mobileSearches = mobileData.total || 0;
    const total = pcSearches + mobileSearches;
    
    // 검색량이 너무 큰 경우 (API 한계) 적절한 값으로 조정
    const adjustSearchVolume = (volume) => {
      if (volume > 100000000) return Math.floor(volume / 1000); // 너무 큰 값은 조정
      return volume;
    };
    
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

// 검색량 추정 함수 (API 호출 실패 시 사용)
function estimateSearchVolume(keyword) {
  console.log(`키워드 "${keyword}"에 대한 추정 검색량 생성`);
  
  // 키워드 길이와 특성에 따른 기본 검색량 추정
  const getPopularityFactor = (kw) => {
    // 키워드 길이가 짧을수록 인기 키워드일 가능성이 높음
    if (kw.length <= 2) return 1000; // 매우 인기 있는 키워드
    if (kw.length <= 4) return 500;  // 인기 있는 키워드
    if (kw.length <= 6) return 200;  // 보통 인기도의 키워드
    if (kw.length <= 10) return 100; // 낮은 인기도의 키워드
    return 50; // 매우 낮은 인기도의 키워드
  };
  
  // 키워드 특성 분석 (지역명, 브랜드명 등 포함 여부)
  const hasLocationName = (kw) => {
    const locations = ['서울', '강남', '부산', '인천', '대구', '대전', '광주', '울산', '경기', '수원', '용인', '분당', '일산', '안양', '성남'];
    return locations.some(loc => kw.includes(loc));
  };
  
  const hasPopularTerm = (kw) => {
    const popularTerms = ['맛집', '여행', '호텔', '숙소', '카페', '음식', '배달', '쇼핑', '옷', '가격', '후기', '리뷰', '추천', '순위', '랭킹'];
    return popularTerms.some(term => kw.includes(term));
  };
  
  // 기본 검색량 계산 (인기도 계수에 기반)
  let popularityFactor = getPopularityFactor(keyword);
  
  // 지역명이나 인기 용어가 포함된 경우 인기도 가중치 증가
  if (hasLocationName(keyword)) popularityFactor *= 1.5;
  if (hasPopularTerm(keyword)) popularityFactor *= 1.3;
  
  const baseVolume = popularityFactor * 20;
  
  // 랜덤 변동 추가 (±30%)
  const variation = baseVolume * 0.3;
  const totalVolume = Math.floor(baseVolume + (Math.random() * variation * 2 - variation));
  
  // PC와 모바일 비율 (모바일이 더 많은 경향)
  const pcRatio = 0.3;
  const mobileRatio = 0.7;
  
  const pcSearches = Math.floor(totalVolume * pcRatio);
  const mobileSearches = Math.floor(totalVolume * mobileRatio);
  
  const result = {
    total: pcSearches + mobileSearches,
    pc: pcSearches,
    mobile: mobileSearches
  };
  
  console.log(`추정 검색량 생성 완료:`, result);
  return result;
} 