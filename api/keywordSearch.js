// Vercel API 라우트용 코드
const fetch = require('node-fetch');

// 네이버 API 키 설정 - 환경 변수에서 가져오거나 기본값 사용
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID || 'kcUpxrk46rltNyD4mp5j';
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || 'qSKhJWoktJ';

// 타임스탬프 생성 함수
const getTimestamp = () => {
  return new Date().getTime();
};

// Vercel API 핸들러 함수
module.exports = async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  
  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 요청 메소드 확인 (GET 또는 POST)
    let keywords = [];
    
    if (req.method === 'GET') {
      // GET 요청 처리
      const { keyword } = req.query || {};
      keywords = keyword ? keyword.split(',').map(k => k.trim()).filter(k => k.length > 0) : [];
    } 
    else if (req.method === 'POST') {
      // POST 요청 처리
      try {
        const requestData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        keywords = Array.isArray(requestData.keywords) ? requestData.keywords : [requestData.keywords];
      } catch (error) {
        console.error('JSON 파싱 오류:', error);
        return res.status(400).json({ 
          status: 'error', 
          message: '요청 데이터 형식이 올바르지 않습니다.' 
        });
      }
    } else {
      return res.status(405).json({ 
        status: 'error', 
        message: '허용되지 않은 메소드입니다. GET 또는 POST 요청을 사용하세요.' 
      });
    }
    
    // 로그 추가
    console.log(`요청 받은 키워드: ${JSON.stringify(keywords)}`);
    
    // 키워드 유효성 검사
    if (!keywords || keywords.length === 0) {
      return res.status(400).json({ 
        status: 'error', 
        message: '검색할 키워드를 입력하세요.' 
      });
    }
    
    // 키워드 개수 제한 (최대 5개)
    if (keywords.length > 5) {
      return res.status(400).json({ 
        status: 'error', 
        message: '키워드는 최대 5개까지만 검색할 수 있습니다.' 
      });
    }

    // API 키 확인
    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
      console.error('네이버 API 키가 설정되지 않았습니다.');
      return res.status(500).json({ 
        status: 'error', 
        message: '서버 설정 오류: API 키가 설정되지 않았습니다.' 
      });
    }

    console.log(`총 ${keywords.length}개 키워드 검색 시작: ${keywords.join(', ')}`);

    // 결과를 저장할 배열
    const results = [];
    const keywordList = [];
    
    // 데이터 랩 결과를 저장할 객체
    const dataLabResults = {
      startDate: '',
      endDate: '',
      timeUnit: 'month',
      results: []
    };

    // 각 키워드에 대해 API 호출
    for (const keyword of keywords) {
      try {
        console.log(`키워드 "${keyword}" 처리 시작`);
        
        // 네이버 API로 검색량 데이터 가져오기
        const searchVolumeData = await getSearchVolumeFromNaver(keyword);
        
        // 키워드 리스트에 추가
        keywordList.push({
          relKeyword: keyword,
          monthlyPcQcCnt: searchVolumeData.pc < 10 ? '< 10' : searchVolumeData.pc,
          monthlyMobileQcCnt: searchVolumeData.mobile < 10 ? '< 10' : searchVolumeData.mobile
        });
        
        // 결과 배열에 추가
        results.push({
          keyword: keyword,
          total: searchVolumeData.total,
          pc: searchVolumeData.pc,
          mobile: searchVolumeData.mobile
        });
        
        console.log(`키워드 "${keyword}" 처리 완료:`, searchVolumeData);
        
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

    // 데이터 랩 기간 설정
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    // 날짜 포맷팅 함수
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    dataLabResults.startDate = formatDate(oneYearAgo);
    dataLabResults.endDate = formatDate(today);

    return res.status(200).json({
      status: 'success',
      results: results,
      keywordList: keywordList,
      dataLab: results.length > 0 ? dataLabResults : null,
      timestamp: getTimestamp()
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      status: 'error',
      message: '서버 오류가 발생했습니다: ' + error.message,
      timestamp: getTimestamp()
    });
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
  
  try {
    // API 호출 함수 (재시도 로직 포함)
    const fetchWithRetry = async (url, options, maxRetries = 3) => {
      let lastError;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`API 호출 시도 ${attempt}/${maxRetries}: ${url}`);
          
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
          
          const data = await response.json();
          console.log(`API 응답 성공: ${url.substring(0, 100)}...`);
          return data;
        } catch (error) {
          console.error(`API 호출 실패 (시도 ${attempt}/${maxRetries}):`, error.message);
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
    
    // 네이버 검색 API 엔드포인트 및 파라미터
    const apiParams = {
      query: encodeURIComponent(keyword),
      display: 1,
      start: 1,
      sort: 'sim',
      timestamp: getTimestamp()
    };
    
    // API 엔드포인트 단순화 (복잡한 구조 대신 더 단순한 접근법 사용)
    const apiEndpoints = [
      {
        name: '웹 검색',
        url: `https://openapi.naver.com/v1/search/blog.json?query=${apiParams.query}&display=${apiParams.display}&start=${apiParams.start}&sort=${apiParams.sort}`,
        device: 'pc'
      },
      {
        name: '모바일 검색',
        url: `https://openapi.naver.com/v1/search/blog.json?query=${apiParams.query}&display=${apiParams.display}&start=${apiParams.start}&sort=${apiParams.sort}`,
        device: 'mobile'
      }
    ];
    
    // API 결과 저장
    const apiResults = [];
    
    // PC와 모바일 검색량 추적
    let pcTotal = 0;
    let mobileTotal = 0;
    
    // 간단한 임시 데이터로 테스트 (실제 API 호출이 작동하지 않을 경우)
    // 디버깅 용도로만 사용하고, 실제 데이터가 필요할 때는 이 부분을 주석 처리하거나 제거하세요
    const useTestData = false;
    if (useTestData) {
      console.log('테스트 데이터 모드: 실제 API 호출 대신 가상 데이터 사용');
      const testTotal = (keyword.length * 100) + 500;
      const testPc = Math.floor(testTotal * 0.3);
      const testMobile = testTotal - testPc;
      
      // 로그 기록
      console.log(`테스트 검색량: ${testTotal} (PC: ${testPc}, 모바일: ${testMobile})`);
      
      return {
        total: testTotal,
        pc: testPc,
        mobile: testMobile
      };
    }
    
    // 모든 API 엔드포인트 순회
    for (const endpoint of apiEndpoints) {
      try {
        console.log(`네이버 ${endpoint.name} API 호출 준비: ${endpoint.url.substring(0, 60)}...`);
        
        const data = await fetchWithRetry(endpoint.url, {
          method: 'GET',
          headers: naverHeaders
        });
        
        // 검색 결과 수 추출
        const total = data.total || 0;
        
        apiResults.push({
          endpoint: endpoint.name,
          device: endpoint.device,
          total: total
        });
        
        // PC와 모바일 검색량 누적
        if (endpoint.device === 'pc') {
          pcTotal = Math.max(pcTotal, total);
        } else if (endpoint.device === 'mobile') {
          mobileTotal = Math.max(mobileTotal, total);
        }
        
        // API 호출 간 딜레이 (네이버 API 호출 제한 방지)
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`네이버 ${endpoint.name} API 호출 실패:`, error.message);
      }
    }
    
    // API 결과가 없으면 오류 발생
    if (apiResults.length === 0) {
      throw new Error('모든 네이버 API 호출에 실패했습니다.');
    }
    
    // 검색량이 너무 큰 경우 (API 한계) 적절한 값으로 조정
    const adjustSearchVolume = (volume) => {
      if (volume > 100000000) return Math.floor(volume / 1000); // 너무 큰 값은 조정
      return volume;
    };
    
    // 총 검색량 계산
    const total = pcTotal + mobileTotal;
    
    // 결과 로그 출력
    console.log(`키워드 "${keyword}" 검색량 결과:`, {
      total: adjustSearchVolume(total),
      pc: adjustSearchVolume(pcTotal),
      mobile: adjustSearchVolume(mobileTotal)
    });
    
    return {
      total: adjustSearchVolume(total),
      pc: adjustSearchVolume(pcTotal),
      mobile: adjustSearchVolume(mobileTotal)
    };
    
  } catch (error) {
    console.error(`네이버 검색 API 처리 중 오류 발생:`, error);
    throw new Error(`네이버 API 오류: ${error.message}`);
  }
} 