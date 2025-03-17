const fetch = require('node-fetch');

// 네이버 API 키 설정
const NAVER_CLIENT_ID = 'kcUpxrk46rltNyD4mp5j';
const NAVER_CLIENT_SECRET = 'qSKhJWoktJ';

// 타임스탬프 생성 함수
function getTimestamp() {
  return new Date().getTime();
}

// 검색량 계산 함수
function calculateSearchVolume(webCount, blogCount, newsCount, cafeCount) {
  // 검색 결과 수를 기반으로 검색량 추정 알고리즘
  // 이 알고리즘은 예시이며, 실제 검색량과 다를 수 있음
  const total = webCount + blogCount * 0.8 + newsCount * 0.5 + cafeCount * 0.7;
  
  // 너무 큰 값은 조정 (최대 1000만)
  return Math.min(Math.round(total * 0.1), 10000000);
}

// 재시도 가능한 API 호출 함수
async function fetchWithRetry(url, options, maxRetries = 3) {
  let retries = 0;
  let lastError;

  while (retries < maxRetries) {
    try {
      const response = await fetch(url, options);
      
      // 응답 상태 확인
      if (response.ok) {
        return await response.json();
      }
      
      // 특정 오류 상태 처리
      if (response.status === 401) {
        throw new Error('API 인증 실패 (401): 네이버 API 키를 확인하세요.');
      }
      
      if (response.status === 429) {
        // 너무 많은 요청 - 잠시 대기 후 재시도
        const waitTime = Math.pow(2, retries) * 1000; // 지수 백오프
        console.log(`너무 많은 요청 (429). ${waitTime}ms 후 재시도...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        retries++;
        continue;
      }
      
      throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.error(`API 호출 오류 (시도 ${retries + 1}/${maxRetries}):`, error.message);
      lastError = error;
      retries++;
      
      if (retries < maxRetries) {
        // 재시도 전 대기
        const waitTime = Math.pow(2, retries) * 1000; // 지수 백오프
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError || new Error('최대 재시도 횟수 초과');
}

// 네이버 검색 API 호출 함수
async function naverSearch(keyword, searchType, device = 'pc') {
  const timestamp = getTimestamp();
  const query = encodeURIComponent(keyword);
  const display = 1; // 결과 개수 (총 개수만 필요하므로 1개만 요청)
  
  // 검색 유형에 따른 URL 설정
  let apiUrl;
  if (searchType === 'web') {
    apiUrl = `https://openapi.naver.com/v1/search/webkr.json?query=${query}&display=${display}&start=1`;
  } else if (searchType === 'blog') {
    apiUrl = `https://openapi.naver.com/v1/search/blog.json?query=${query}&display=${display}&start=1`;
  } else if (searchType === 'news') {
    apiUrl = `https://openapi.naver.com/v1/search/news.json?query=${query}&display=${display}&start=1`;
  } else if (searchType === 'cafearticle') {
    apiUrl = `https://openapi.naver.com/v1/search/cafearticle.json?query=${query}&display=${display}&start=1`;
  } else {
    throw new Error(`지원하지 않는 검색 유형: ${searchType}`);
  }
  
  // 모바일 검색 시 파라미터 추가
  if (device === 'mobile') {
    apiUrl += '&mobile=true';
  }
  
  // API 요청 옵션
  const options = {
    method: 'GET',
    headers: {
      'X-Naver-Client-Id': NAVER_CLIENT_ID,
      'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
      'Content-Type': 'application/json'
    }
  };
  
  try {
    // API 호출 및 결과 반환
    const data = await fetchWithRetry(apiUrl, options);
    return {
      total: data.total || 0,
      type: searchType,
      device: device
    };
  } catch (error) {
    console.error(`${searchType} 검색 오류 (${device}):`, error.message);
    return {
      total: 0,
      type: searchType,
      device: device,
      error: error.message
    };
  }
}

// 블로그 발행량 계산 함수
async function calculateBlogPublishRate(keyword) {
  try {
    // 최근 1개월 블로그 발행량 추정
    const blogResult = await naverSearch(keyword, 'blog');
    
    // 블로그 발행량은 전체 검색 결과의 약 10%로 가정
    // 실제 정확한 계산을 위해서는 날짜 필터링이 필요하지만 네이버 API에서 제공하지 않음
    const monthlyRate = Math.round(blogResult.total * 0.1);
    
    return monthlyRate;
  } catch (error) {
    console.error('블로그 발행량 계산 오류:', error.message);
    return 0;
  }
}

// 블로그 포화도 계산 함수
function calculateBlogSaturation(blogTotal, searchVolume) {
  if (searchVolume === 0) return '낮음';
  
  const ratio = blogTotal / searchVolume;
  
  if (ratio > 0.5) return '매우 높음';
  if (ratio > 0.3) return '높음';
  if (ratio > 0.1) return '중간';
  return '낮음';
}

// 쇼핑 카테고리 추정 함수 (실제로는 더 복잡한 로직이 필요)
function estimateShoppingCategory(keyword) {
  // 간단한 키워드 기반 카테고리 추정
  const categories = {
    '의류': ['옷', '셔츠', '바지', '코트', '자켓', '패션', '의류'],
    '전자제품': ['폰', '컴퓨터', '노트북', '태블릿', '전자', '가전'],
    '식품': ['음식', '과자', '식품', '음료', '차', '커피'],
    '뷰티': ['화장품', '스킨케어', '메이크업', '뷰티', '미용'],
    '가구': ['가구', '소파', '침대', '테이블', '의자'],
    '도서': ['책', '도서', '소설', '만화', '잡지']
  };
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(k => keyword.includes(k))) {
      return category;
    }
  }
  
  return '기타';
}

// 경쟁강도 계산 함수
function calculateCompetition(searchVolume, blogTotal) {
  if (searchVolume === 0) return '낮음';
  
  const ratio = blogTotal / searchVolume;
  
  if (ratio > 0.7) return '매우 높음';
  if (ratio > 0.4) return '높음';
  if (ratio > 0.2) return '중간';
  return '낮음';
}

// 상업성 계산 함수
function calculateCommercial(keyword) {
  const commercialTerms = ['구매', '할인', '최저가', '쇼핑', '구입', '판매', '가격', '원', '만원', '세일', '특가'];
  
  let score = 0;
  for (const term of commercialTerms) {
    if (keyword.includes(term)) {
      score += 1;
    }
  }
  
  if (score >= 3) return '매우 높음';
  if (score >= 2) return '높음';
  if (score >= 1) return '중간';
  return '낮음';
}

// 메인 핸들러 함수
exports.handler = async (event, context) => {
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };
  
  // OPTIONS 요청 처리 (CORS 프리플라이트)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS enabled' })
    };
  }
  
  try {
    // 요청 파라미터 처리
    let keywords = [];
    
    if (event.httpMethod === 'GET') {
      // GET 요청 처리
      const params = event.queryStringParameters || {};
      const keyword = params.keyword || '';
      
      if (!keyword) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: '키워드가 제공되지 않았습니다.' })
        };
      }
      
      // 쉼표로 구분된 키워드 처리
      keywords = keyword.split(',').map(k => k.trim()).filter(k => k);
    } else if (event.httpMethod === 'POST') {
      // POST 요청 처리
      try {
        const body = JSON.parse(event.body);
        const dataQ = body.DataQ || '';
        
        if (!dataQ) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: '키워드가 제공되지 않았습니다.' })
          };
        }
        
        // 쉼표로 구분된 키워드 처리
        keywords = dataQ.split(',').map(k => k.trim()).filter(k => k);
      } catch (error) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: '잘못된 요청 형식입니다.' })
        };
      }
    } else {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: '지원하지 않는 HTTP 메소드입니다.' })
      };
    }
    
    // 키워드 수 제한 (최대 5개)
    if (keywords.length > 5) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '한 번에 최대 5개의 키워드만 처리할 수 있습니다.' })
      };
    }
    
    // 특수 문자 검사
    const specialChars = /[,'"\\]/;
    const invalidKeywords = keywords.filter(k => specialChars.test(k));
    
    if (invalidKeywords.length > 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: '키워드에 사용할 수 없는 특수문자가 포함되어 있습니다.',
          invalidKeywords
        })
      };
    }
    
    // 결과 저장 배열
    const results = [];
    
    // 각 키워드에 대한 검색 수행
    for (const keyword of keywords) {
      console.log(`키워드 검색 시작: ${keyword}`);
      
      // 검색 API 호출
      const [webPC, blogPC, newsPC, cafePC, webMobile, blogMobile, newsMobile, cafeMobile] = await Promise.all([
        naverSearch(keyword, 'web', 'pc'),
        naverSearch(keyword, 'blog', 'pc'),
        naverSearch(keyword, 'news', 'pc'),
        naverSearch(keyword, 'cafearticle', 'pc'),
        naverSearch(keyword, 'web', 'mobile'),
        naverSearch(keyword, 'blog', 'mobile'),
        naverSearch(keyword, 'news', 'mobile'),
        naverSearch(keyword, 'cafearticle', 'mobile')
      ]);
      
      // PC 및 모바일 검색량 계산
      const pcSearchVolume = calculateSearchVolume(
        webPC.total, blogPC.total, newsPC.total, cafePC.total
      );
      
      const mobileSearchVolume = calculateSearchVolume(
        webMobile.total, blogMobile.total, newsMobile.total, cafeMobile.total
      );
      
      // 총 검색량
      const totalSearchVolume = pcSearchVolume + mobileSearchVolume;
      
      // 블로그 발행량 계산
      const monthlyBlogRate = await calculateBlogPublishRate(keyword);
      
      // 블로그 포화도 계산
      const blogSaturation = calculateBlogSaturation(blogPC.total + blogMobile.total, totalSearchVolume);
      
      // 쇼핑 카테고리 추정
      const shopCategory = estimateShoppingCategory(keyword);
      
      // 경쟁강도 계산
      const competition = calculateCompetition(totalSearchVolume, blogPC.total + blogMobile.total);
      
      // 상업성 계산
      const commercial = calculateCommercial(keyword);
      
      // 클릭률 추정 (예시 값)
      const clickRate = '2.5%';
      
      // 결과 저장
      results.push({
        keyword,
        pcSearchVolume,
        mobileSearchVolume,
        totalSearchVolume,
        monthlyBlogRate,
        blogSaturation,
        shopCategory,
        webTotal: webPC.total + webMobile.total,
        blogTotal: blogPC.total + blogMobile.total,
        competition,
        commercial,
        clickRate
      });
      
      console.log(`키워드 검색 완료: ${keyword}, PC: ${pcSearchVolume}, Mobile: ${mobileSearchVolume}, Total: ${totalSearchVolume}`);
      
      // API 호출 간 지연 (네이버 API 제한 고려)
      if (keywords.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    // 결과 반환
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        count: results.length,
        keywords,
        results,
        timestamp: getTimestamp()
      })
    };
  } catch (error) {
    console.error('서버리스 함수 오류:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: '서버 오류가 발생했습니다.',
        message: error.message
      })
    };
  }
}; 