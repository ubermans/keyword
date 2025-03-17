# 네이버 키워드 검색량 조회 서비스

네이버 API를 활용하여 키워드 검색량을 조회하는 웹 서비스입니다.

## 기능

- 키워드 검색량 조회 (PC, 모바일, 총 검색량)
- 쉼표로 구분된 다중 키워드 검색 지원 (최대 5개)
- 월별 검색량 그래프 표시

## 기술 스택

- Frontend: HTML, CSS, JavaScript, jQuery, Chart.js
- Backend: Node.js, Vercel Serverless Functions
- API: 네이버 검색 API

## 로컬 개발 환경 설정

1. 저장소 클론
```bash
git clone <repository-url>
cd keyword-search-volume
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 내용을 추가합니다:
```
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
```

4. 개발 서버 실행
```bash
npm run dev
```

## 배포

이 프로젝트는 Vercel에 배포됩니다. GitHub 저장소를 Vercel에 연결하면 자동으로 배포됩니다.

1. [Vercel](https://vercel.com)에 가입하고 GitHub 계정을 연결합니다.
2. 새 프로젝트를 생성하고 이 저장소를 선택합니다.
3. 환경 변수를 설정합니다:
   - `NAVER_CLIENT_ID`
   - `NAVER_CLIENT_SECRET`
4. 배포 버튼을 클릭합니다.

## 라이선스

MIT 