const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

// 네이버 API 접근 정보 (실제 운영 시에는 환경변수로 설정 필요)
const NAVER_API_KEY = 'YOUR_NAVER_API_KEY'; 
const NAVER_API_SECRET = 'YOUR_NAVER_API_SECRET';
const NAVER_API_URL = 'https://api.naver.com/keywordstool';

exports.handler = async function(event, context) {
  // CORS 헤더
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
  
  // OPTIONS 요청 처리 (CORS 프리플라이트)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS enabled' })
    };
  }
  
  // POST 요청이 아닌 경우
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }
  
  let browser = null;
  
  try {
    console.log('Request received:', event.body);
    
    // 요청 바디 파싱
    const body = JSON.parse(event.body);
    const { keywords } = body;
    
    console.log('Keywords received:', keywords);
    
    // 요청 데이터 유효성 검사
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '유효한 키워드를 입력해주세요.' })
      };
    }
    
    if (keywords.length > 100) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '키워드는 최대 100개까지 입력 가능합니다.' })
      };
    }

    // 요청에 사용할 키워드 문자열
    const keywordString = keywords.join(',');
    console.log('Keyword string:', keywordString);
    
    try {
      console.log('Launching browser');
      
      // 헤드리스 브라우저 시작
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
      });
      
      // 새 페이지 열기
      const page = await browser.newPage();
      
      // 사용자 에이전트 설정
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // 마피아넷으로 이동
      console.log('Navigating to ma-pia.net');
      await page.goto('https://www.ma-pia.net/keyword/keyword.php', {
        waitUntil: 'networkidle2',
      });
      
      // 키워드 입력
      console.log('Typing keywords');
      await page.type('textarea[name="keyword"]', keywordString);
      
      // 폼 제출
      console.log('Submitting form');
      await Promise.all([
        page.click('input[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
      ]);
      
      // 결과 추출
      console.log('Extracting results');
      const results = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table.list_tbl tr')).slice(1); // 헤더 제외
        return rows.map(row => {
          const cells = Array.from(row.querySelectorAll('td'));
          return {
            keyword: cells[0]?.textContent.trim() || '',
            pcMonthlyQcCnt: parseInt(cells[1]?.textContent.replace(/,/g, '')) || 0,
            mobileMonthlyQcCnt: parseInt(cells[2]?.textContent.replace(/,/g, '')) || 0,
            totalMonthlyQcCnt: parseInt(cells[3]?.textContent.replace(/,/g, '')) || 0,
            competitionIndex: parseFloat(cells[4]?.textContent) || 0,
            compIdx: cells[5]?.textContent.trim() || ''
          };
        });
      });
      
      console.log(`Extracted ${results.length} results`);
      
      // 브라우저 닫기
      await browser.close();
      browser = null;
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ results })
      };
    } catch (apiError) {
      console.error('마피아넷 크롤링 오류:', apiError);
      
      // 브라우저가 열려있으면 닫기
      if (browser !== null) {
        await browser.close();
        browser = null;
      }
      
      // API 요청에 실패한 경우 더미 데이터 반환
      console.log('Returning dummy data instead');
      const dummyResults = keywords.map(keyword => ({
        keyword,
        pcMonthlyQcCnt: Math.floor(Math.random() * 10000),
        mobileMonthlyQcCnt: Math.floor(Math.random() * 20000),
        totalMonthlyQcCnt: Math.floor(Math.random() * 30000),
        competitionIndex: (Math.random() * 0.9 + 0.1).toFixed(2),
        compIdx: ['낮음', '보통', '높음'][Math.floor(Math.random() * 3)]
      }));
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          results: dummyResults,
          error: apiError.message,
          usingDummyData: true
        })
      };
    }
    
  } catch (error) {
    console.error('키워드 검색 오류:', error);
    
    // 브라우저가 열려있으면 닫기
    if (browser !== null) {
      await browser.close();
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: '서버 오류가 발생했습니다.', 
        message: error.message,
        stack: error.stack
      })
    };
  }
}; 