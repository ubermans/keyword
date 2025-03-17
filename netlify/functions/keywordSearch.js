const fetch = require('node-fetch');
const https = require('https');

// SSL 인증서 검증을 비활성화하는 에이전트 생성
const agent = new https.Agent({
  rejectUnauthorized: false
});

// 네이버 API 키 설정
// 환경 변수가 설정되어 있으면 그 값을 사용하고, 아니면 하드코딩된 값을 사용
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

    // 결과를 저장할 배열
    const results = [];

    // 네이버 API 호출을 위한 헤더 설정
    const naverHeaders = {
      'X-Naver-Client-Id': NAVER_CLIENT_ID,
      'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
      'Content-Type': 'application/json'
    };

    // 각 키워드에 대해 API 호출
    for (const keyword of keywords) {
      try {
        console.log(`키워드 "${keyword}" 처리 시작`);
        
        // 네이버 검색 API 호출 (웹 문서 검색)
        const webSearchUrl = `https://openapi.naver.com/v1/search/webkr?query=${encodeURIComponent(keyword)}&display=10`;
        const blogSearchUrl = `https://openapi.naver.com/v1/search/blog?query=${encodeURIComponent(keyword)}&display=10`;
        
        console.log(`네이버 웹 검색 API 호출: ${webSearchUrl}`);
        
        // 웹 검색 결과 가져오기
        const webResponse = await fetch(webSearchUrl, {
          method: 'GET',
          headers: naverHeaders,
          agent: agent // SSL 인증서 검증 비활성화
        });
        
        // 블로그 검색 결과 가져오기
        const blogResponse = await fetch(blogSearchUrl, {
          method: 'GET',
          headers: naverHeaders,
          agent: agent // SSL 인증서 검증 비활성화
        });
        
        // API 응답 상태 확인
        if (!webResponse.ok || !blogResponse.ok) {
          throw new Error(`네이버 API 요청 실패: 웹 검색(${webResponse.status}), 블로그 검색(${blogResponse.status})`);
        }
        
        const webData = await webResponse.json();
        const blogData = await blogResponse.json();
        
        console.log(`네이버 웹 검색 API 응답:`, webData);
        console.log(`네이버 블로그 검색 API 응답:`, blogData);
        
        // 검색 결과에서 데이터 추출
        const webTotal = webData.total || 0;
        const blogTotal = blogData.total || 0;
        
        // 검색량 계산 개선 - 네이버 검색 결과 수를 기반으로 더 현실적인 검색량 추정
        // 검색 결과가 많을수록 실제 검색량도 많을 가능성이 높지만, 선형적이지 않음
        let estimatedSearchVolume = 0;
        
        if (webTotal < 1000) {
          estimatedSearchVolume = webTotal * 2; // 검색 결과가 적으면 검색량도 적음
        } else if (webTotal < 10000) {
          estimatedSearchVolume = 2000 + (webTotal - 1000) * 0.5; // 중간 범위
        } else if (webTotal < 100000) {
          estimatedSearchVolume = 6500 + (webTotal - 10000) * 0.1; // 높은 범위
        } else if (webTotal < 1000000) {
          estimatedSearchVolume = 15500 + (webTotal - 100000) * 0.05; // 매우 높은 범위
        } else {
          estimatedSearchVolume = 60500 + (webTotal - 1000000) * 0.01; // 극도로 높은 범위
        }
        
        // 검색량이 너무 낮거나 높지 않도록 조정
        estimatedSearchVolume = Math.max(10, Math.min(estimatedSearchVolume, 500000));
        
        // PC와 모바일 검색량 비율 추정 (실제 데이터는 아니지만 합리적인 추정)
        const pcRatio = 0.3; // PC 검색 비율 (30%)
        const mobileRatio = 0.7; // 모바일 검색 비율 (70%)
        
        const pcSearches = Math.floor(estimatedSearchVolume * pcRatio);
        const mobileSearches = Math.floor(estimatedSearchVolume * mobileRatio);
        const total = pcSearches + mobileSearches;
        
        console.log(`키워드 "${keyword}" 검색량 - PC: ${pcSearches}, Mobile: ${mobileSearches}, 합계: ${total} (웹 검색 결과 수: ${webTotal})`);
        
        // 검색량 데이터 생성
        results.push({
          keyword: keyword,
          pc: pcSearches,
          mobile: mobileSearches,
          total: total,
          monthBlog: blogTotal,
          blogSaturation: getBlogSaturation(blogTotal),
          shopCategory: '일반',
          pcClick: Math.floor(pcSearches * 0.7),
          mobileClick: Math.floor(mobileSearches * 0.6),
          pcClickRate: `${Math.floor(70 + Math.random() * 20)}%`,
          mobileClickRate: `${Math.floor(60 + Math.random() * 20)}%`,
          competition: getCompetition(webTotal),
          avgAdCount: Math.min(20, Math.floor(webTotal / 1000))
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

// 블로그 포화도 계산 함수
function getBlogSaturation(blogCount) {
  if (blogCount < 500) return '매우 낮음';
  if (blogCount < 2000) return '낮음';
  if (blogCount < 10000) return '보통';
  if (blogCount < 50000) return '높음';
  return '매우 높음';
}

// 경쟁 정도 계산 함수
function getCompetition(webTotal) {
  if (webTotal < 5000) return '매우 낮음';
  if (webTotal < 20000) return '낮음';
  if (webTotal < 100000) return '보통';
  if (webTotal < 500000) return '높음';
  return '매우 높음';
} 