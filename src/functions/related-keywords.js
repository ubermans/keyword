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
    console.log('Related keyword request received:', event.body);
    
    // 요청 바디 파싱
    const body = JSON.parse(event.body);
    const { keyword } = body;
    
    console.log('Keyword received:', keyword);
    
    // 요청 데이터 유효성 검사
    if (!keyword || typeof keyword !== 'string' || keyword.trim() === '') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '유효한 키워드를 입력해주세요.' })
      };
    }

    try {
      console.log('Launching browser for related keywords');
      
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
      
      // 마피아넷 연관 키워드 페이지로 이동
      console.log('Navigating to ma-pia.net/keyword/recom.php');
      await page.goto('https://www.ma-pia.net/keyword/recom.php', {
        waitUntil: 'networkidle2',
      });
      
      // 키워드 입력
      console.log('Typing keyword:', keyword);
      await page.type('input[name="keyword"]', keyword.trim());
      
      // 폼 제출
      console.log('Submitting form');
      await Promise.all([
        page.click('input[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
      ]);
      
      // 결과 추출
      console.log('Extracting related keywords');
      const relatedKeywords = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table.list_tbl tr')).slice(1); // 헤더 제외
        return rows.map(row => row.querySelector('td')?.textContent.trim()).filter(Boolean);
      });
      
      console.log(`Extracted ${relatedKeywords.length} related keywords`);
      
      // 브라우저 닫기
      await browser.close();
      browser = null;
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          results: relatedKeywords.map(kw => ({ relKeyword: kw })),
          relKeyword: keyword
        })
      };
      
    } catch (apiError) {
      console.error('마피아넷 연관 키워드 크롤링 오류:', apiError);
      
      // 브라우저가 열려있으면 닫기
      if (browser !== null) {
        await browser.close();
        browser = null;
      }
      
      // API 요청에 실패한 경우 더미 데이터 반환
      console.log('Returning dummy related keyword data');
      
      // 예시 관련 키워드 생성
      const dummyKeywords = [
        `${keyword} 장점`,
        `${keyword} 단점`,
        `${keyword} 추천`,
        `${keyword} 가격`,
        `${keyword} 후기`,
        `${keyword} 사용법`,
        `${keyword} 비교`,
        `${keyword} 판매처`
      ];
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          results: dummyKeywords.map(kw => ({ relKeyword: kw })),
          relKeyword: keyword,
          usingDummyData: true,
          error: apiError.message
        })
      };
    }
    
  } catch (error) {
    console.error('연관 키워드 검색 오류:', error);
    
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