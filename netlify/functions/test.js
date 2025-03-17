const keywordSearch = require('./keywordSearch');

// 테스트 이벤트 객체 생성
const testEvent = {
  httpMethod: 'POST',
  body: JSON.stringify({
    keywords: ['테스트']
  })
};

// 함수 실행
async function runTest() {
  try {
    console.log('테스트 시작...');
    const result = await keywordSearch.handler(testEvent);
    console.log('결과:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('오류 발생:', error);
  }
}

runTest(); 