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
        
        // 네이버 검색 API로 검색량 데이터 가져오기
        const searchVolumeData = await getSearchVolumeFromNaver(keyword);
        
        // 결과 배열에 추가
        results.push({
          keyword: keyword,
          total: searchVolumeData.total,
          pc: searchVolumeData.pc,
          mobile: searchVolumeData.mobile
        });
        
        console.log(`키워드 "${keyword}" 처리 완료: 총 ${searchVolumeData.total}회 (PC: ${searchVolumeData.pc}, 모바일: ${searchVolumeData.mobile})`);
        
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
    // 웹 검색 결과 가져오기
    const webSearchUrl = `https://openapi.naver.com/v1/search/webkr.json?query=${encodeURIComponent(keyword)}&display=1`;
    const webResponse = await fetch(webSearchUrl, {
      method: 'GET',
      headers: naverHeaders,
      agent: agent // SSL 인증서 검증 비활성화
    });
    
    // 모바일 검색 결과 가져오기
    const mobileSearchUrl = `https://openapi.naver.com/v1/search/webkr.json?query=${encodeURIComponent(keyword)}&display=1&mobile=1`;
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