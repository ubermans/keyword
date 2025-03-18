# 네이버 키워드 검색량 조회 서비스

ma-pia.net의 키워드 검색 기능을 참고하여 만든 네이버 키워드 검색량 조회 웹 애플리케이션입니다. 이 서비스는 Netlify를 통해 배포됩니다.

## 주요 기능

- 키워드 검색량 조회: 최대 100개 키워드의 PC/모바일 검색량 조회
- 연관 키워드 검색: 특정 키워드와 관련된 키워드 목록 제공
- 검색 결과 CSV 다운로드 기능

## 기술 스택

- 프론트엔드: HTML, CSS, JavaScript, Bootstrap 5
- 백엔드: Netlify Functions (서버리스)
- API: 네이버 광고 API

## 개발 환경 설정

### 필수 요구사항

- Node.js v14 이상
- Netlify CLI (배포용)

### 로컬 개발 환경 설정

1. 저장소 클론
   ```
   git clone [repository-url]
   cd keyword-search
   ```

2. 의존성 설치
   ```
   npm install
   ```

3. 환경 변수 설정 (.env 파일 생성)
   ```
   NAVER_API_KEY=your_naver_api_key
   NAVER_API_SECRET=your_naver_api_secret
   ```

4. 개발 서버 실행
   ```
   npm run dev
   ```

## 배포 방법

### Netlify CLI로 배포

1. Netlify CLI 설치
   ```
   npm install -g netlify-cli
   ```

2. Netlify 로그인
   ```
   netlify login
   ```

3. 배포
   ```
   netlify deploy --prod
   ```

### 대시보드에서 배포

1. Netlify 계정 생성 및 로그인
2. 새 사이트 배포 > GitHub에서 가져오기
3. 저장소 및 브랜치 선택
4. 빌드 설정 확인 및 배포

## 참고 자료

- [마피아넷(ma-pia.net)](https://ma-pia.net/keyword/keyword.php)
- [네이버 검색광고 API](https://developers.naver.com/docs/searchad/overview/)

## 라이선스

MIT License 