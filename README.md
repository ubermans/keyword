# 네이버 키워드 검색량 조회 서비스

## 프로젝트 개요
이 서비스는 네이버 검색 API를 활용하여 키워드의 검색량을 추정하고 다양한 관련 지표를 제공합니다. 마피아넷(ma-pia.net)의 키워드 검색 기능을 참고하여 구현했습니다.

## 주요 기능

- 키워드 검색량 조회 (PC, 모바일, 총 검색량)
- 다중 키워드 검색 (쉼표로 구분, 최대 5개)
- 파일 업로드를 통한 키워드 일괄 검색
- 검색 결과 CSV 다운로드
- 월별 검색량 추이 차트 (상세 정보)
- 블로그 발행량, 포화도, 경쟁강도 등 다양한 지표 제공

## 기술 스택

- Frontend: HTML, CSS, JavaScript, Chart.js
- Backend: Node.js, Netlify Functions
- API: 네이버 검색 API

## 설치 및 실행 방법

### 사전 요구사항
- Node.js (v14 이상)
- npm 또는 yarn

### 설치 단계
1. 저장소 클론
```bash
git clone <repository-url>
cd new_web
```

2. 의존성 설치
```bash
npm install
```

3. 개발 서버 실행
```bash
npm run dev
```

4. 브라우저에서 `http://localhost:8888` 접속

## API 키 정보
이 프로젝트는 이미 네이버 API 키가 설정되어 있습니다:
- Client ID: kcUpxrk46rltNyD4mp5j
- Client Secret: qSKhJWoktJ

별도의 API 키 설정이 필요하지 않습니다.

## 배포 방법
자세한 배포 방법은 `SETUP_STEPS.md` 파일을 참조하세요.

## 사용 가이드
자세한 사용 방법은 `GUIDE.md` 파일을 참조하세요.

## 문제 해결
일반적인 문제 해결 방법은 `GUIDE.md` 파일의 '문제 해결' 섹션을 참조하세요.

## 네이버 API 키 발급 방법

1. [네이버 개발자 센터](https://developers.naver.com)에 로그인합니다.
2. "애플리케이션 등록" 메뉴에서 새 애플리케이션을 등록합니다.
3. "API 설정" 탭에서 "검색" API를 선택합니다.
4. 발급받은 Client ID와 Client Secret을 환경 변수에 설정합니다.

## 검색량 추정 방식

네이버 검색 API에서 제공하는 검색 결과 수를 기반으로 검색량을 추정합니다. 실제 검색량과 차이가 있을 수 있으며, 참고용으로만 활용해 주세요.

## 라이선스

MIT 