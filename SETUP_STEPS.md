# 네이버 키워드 검색량 조회 서비스 설치 가이드

이 문서는 네이버 키워드 검색량 조회 서비스를 처음부터 설치하고 배포하는 과정을 단계별로 자세히 설명합니다.

## 1. 사전 준비

### 1.1 필요한 도구 설치

#### Node.js 설치
1. [Node.js 공식 웹사이트](https://nodejs.org/)에 접속합니다.
2. LTS 버전(권장)을 다운로드하고 설치합니다.
3. 설치가 완료되면 명령 프롬프트(Windows) 또는 터미널(Mac/Linux)을 열고 다음 명령어를 실행하여 설치를 확인합니다:
   ```bash
   node --version
   npm --version
   ```

#### Git 설치
1. [Git 공식 웹사이트](https://git-scm.com/)에 접속합니다.
2. 운영체제에 맞는 버전을 다운로드하고 설치합니다.
3. 설치가 완료되면 명령 프롬프트 또는 터미널에서 다음 명령어를 실행하여 설치를 확인합니다:
   ```bash
   git --version
   ```

### 1.2 계정 준비

#### GitHub 계정 생성
1. [GitHub](https://github.com/)에 접속하여 계정이 없다면 가입합니다.
2. 이메일 인증을 완료합니다.

#### Netlify 계정 생성
1. [Netlify](https://netlify.com/)에 접속하여 계정이 없다면 가입합니다.
2. GitHub 계정으로 로그인하는 것을 권장합니다.

#### 네이버 개발자 계정 준비
1. [네이버 개발자 센터](https://developers.naver.com/)에 접속합니다.
2. 네이버 계정으로 로그인합니다.

## 2. 프로젝트 설정

### 2.1 프로젝트 다운로드

1. 명령 프롬프트 또는 터미널을 열고 프로젝트를 저장할 디렉토리로 이동합니다:
   ```bash
   cd 원하는/디렉토리/경로
   ```

2. 프로젝트를 다운로드합니다:
   ```bash
   # GitHub 저장소가 있는 경우
   git clone https://github.com/username/repo-name.git
   
   # 또는 ZIP 파일로 다운로드한 경우 압축을 풀고 해당 디렉토리로 이동
   cd 프로젝트_디렉토리
   ```

3. 프로젝트 디렉토리로 이동합니다:
   ```bash
   cd new_web
   ```

### 2.2 의존성 설치

1. 프로젝트 디렉토리에서 다음 명령어를 실행하여 필요한 패키지를 설치합니다:
   ```bash
   npm install
   ```

2. Netlify CLI를 전역으로 설치합니다 (선택 사항이지만 권장):
   ```bash
   npm install -g netlify-cli
   ```

## 3. 네이버 API 키 발급

> **참고**: 이 프로젝트는 이미 네이버 API 키가 설정되어 있습니다:
> - Client ID: kcUpxrk46rltNyD4mp5j
> - Client Secret: qSKhJWoktJ
>
> 아래 단계는 새로운 API 키를 발급받아 사용하고 싶을 때 참고하세요.

### 3.1 애플리케이션 등록

1. [네이버 개발자 센터](https://developers.naver.com/)에 로그인합니다.

2. 상단 메뉴에서 "Application" > "애플리케이션 등록"을 클릭합니다.

3. 다음 정보를 입력합니다:
   - **애플리케이션 이름**: "키워드 검색량 조회" (또는 원하는 이름)
   - **사용 API**: "검색" 체크박스 선택
   - **웹 서비스 URL**: 
     - 로컬 개발용: `http://localhost:8888`
     - 배포 후: 실제 배포 URL (예: `https://your-site-name.netlify.app`)
     - 둘 다 입력 가능 (쉼표로 구분)
   - **환경**: "WEB" 선택
   - **로그인 오픈 API 서비스 환경**: 사용하지 않음

4. "등록하기" 버튼을 클릭합니다.

### 3.2 API 키 확인

1. 애플리케이션 등록이 완료되면 "Application > 내 애플리케이션"에서 방금 등록한 애플리케이션을 클릭합니다.

2. "개요" 탭에서 다음 정보를 확인하고 안전하게 저장해둡니다:
   - **Client ID**
   - **Client Secret**

## 4. 로컬 개발 환경 설정

### 4.1 환경 변수 설정

1. 프로젝트 루트 디렉토리에 `.env` 파일을 생성합니다:
   ```bash
   # Windows
   echo NAVER_CLIENT_ID=kcUpxrk46rltNyD4mp5j > .env
   echo NAVER_CLIENT_SECRET=qSKhJWoktJ >> .env
   
   # Mac/Linux
   echo "NAVER_CLIENT_ID=kcUpxrk46rltNyD4mp5j" > .env
   echo "NAVER_CLIENT_SECRET=qSKhJWoktJ" >> .env
   ```
   (이미 설정되어 있으므로 수정할 필요가 없습니다. 다른 API 키를 사용하고 싶다면 위 값을 변경하세요.)

2. `.env` 파일이 `.gitignore`에 포함되어 있는지 확인합니다. 이는 보안을 위해 중요합니다.

### 4.2 로컬 서버 실행

1. 다음 명령어로 개발 서버를 실행합니다:
   ```bash
   npm run dev
   ```

2. 브라우저에서 `http://localhost:8888`으로 접속하여 서비스가 정상적으로 작동하는지 확인합니다.

3. 키워드를 입력하고 검색 버튼을 클릭하여 API가 정상적으로 작동하는지 테스트합니다.

## 5. GitHub 저장소 설정

### 5.1 새 저장소 생성

1. [GitHub](https://github.com/)에 로그인합니다.

2. 우측 상단의 "+" 아이콘을 클릭하고 "New repository"를 선택합니다.

3. 저장소 이름을 입력하고 (예: "keyword-search-volume"), 필요에 따라 설명을 추가합니다.

4. 저장소를 공개(Public) 또는 비공개(Private)로 설정합니다.

5. "Create repository" 버튼을 클릭합니다.

### 5.2 로컬 프로젝트 연결

1. 프로젝트 디렉토리에서 다음 명령어를 실행하여 Git 저장소를 초기화합니다:
   ```bash
   git init
   ```

2. 모든 파일을 스테이징합니다:
   ```bash
   git add .
   ```

3. 변경 사항을 커밋합니다:
   ```bash
   git commit -m "Initial commit"
   ```

4. GitHub 저장소를 원격 저장소로 추가합니다:
   ```bash
   git remote add origin https://github.com/your-username/your-repo-name.git
   ```
   (위의 URL을 실제 GitHub 저장소 URL로 대체하세요)

5. 변경 사항을 GitHub에 푸시합니다:
   ```bash
   git push -u origin main
   ```
   (GitHub의 기본 브랜치가 `master`인 경우 `main` 대신 `master`를 사용하세요)

## 6. Netlify 배포

### 6.1 Netlify에 사이트 추가

1. [Netlify](https://netlify.com/)에 로그인합니다.

2. 대시보드에서 "New site from Git" 버튼을 클릭합니다.

3. "GitHub"을 선택하고, 필요한 경우 GitHub 계정에 대한 권한을 부여합니다.

4. 방금 생성한 저장소를 선택합니다.

### 6.2 배포 설정

1. 다음과 같이 배포 설정을 구성합니다:
   - **Branch to deploy**: `main` (또는 사용 중인 기본 브랜치)
   - **Build command**: 비워두거나 `npm run build`
   - **Publish directory**: `.`

2. "Show advanced" 버튼을 클릭합니다.

3. "New variable" 버튼을 클릭하여 다음 환경 변수를 추가합니다:
   - **Key**: `NAVER_CLIENT_ID`, **Value**: kcUpxrk46rltNyD4mp5j
   - **Key**: `NAVER_CLIENT_SECRET`, **Value**: qSKhJWoktJ
   (이미 코드에 직접 설정되어 있으므로 환경 변수 설정은 선택 사항입니다.)

4. "Deploy site" 버튼을 클릭합니다.

### 6.3 배포 확인

1. 배포가 완료되면 Netlify에서 제공하는 URL(예: `https://random-name.netlify.app`)로 접속합니다.

2. 서비스가 정상적으로 작동하는지 확인합니다.

3. 필요한 경우 Netlify 대시보드에서 "Domain settings"를 클릭하여 사용자 정의 도메인을 설정할 수 있습니다.

## 7. 문제 해결

### 7.1 로컬 개발 문제

- **문제**: `npm run dev` 실행 시 오류 발생
  - **해결 방법**: Node.js 버전이 최신인지 확인하고, 필요한 경우 `npm install`을 다시 실행합니다.

- **문제**: API 호출 시 401 오류
  - **해결 방법**: `.env` 파일의 API 키가 올바른지 확인하고, 네이버 개발자 센터에서 애플리케이션 설정을 확인합니다.

### 7.2 배포 문제

- **문제**: Netlify 배포 후 API 호출이 작동하지 않음
  - **해결 방법**: 
    1. Netlify 대시보드에서 환경 변수가 올바르게 설정되었는지 확인합니다.
    2. 네이버 개발자 센터에서 웹 서비스 URL에 배포된 사이트 URL이 포함되어 있는지 확인합니다.

- **문제**: 배포 실패
  - **해결 방법**: Netlify 대시보드에서 "Deploys" 탭을 클릭하여 배포 로그를 확인하고 오류를 해결합니다.

## 8. 추가 설정 (선택 사항)

### 8.1 사용자 정의 도메인 설정

1. Netlify 대시보드에서 사이트를 선택합니다.

2. "Domain settings"를 클릭합니다.

3. "Add custom domain" 버튼을 클릭하고 원하는 도메인을 입력합니다.

4. 도메인 제공업체의 DNS 설정에서 Netlify의 지시에 따라 DNS 레코드를 추가합니다.

### 8.2 HTTPS 설정

1. 사용자 정의 도메인을 추가한 후, Netlify는 자동으로 Let's Encrypt SSL 인증서를 발급합니다.

2. "HTTPS" 섹션에서 "Verify DNS configuration" 버튼을 클릭하여 설정을 확인합니다.

3. SSL 인증서가 발급되면 사이트는 자동으로 HTTPS를 사용합니다.

## 9. 유지 관리

### 9.1 코드 업데이트

1. 로컬에서 코드를 수정합니다.

2. 변경 사항을 커밋하고 GitHub에 푸시합니다:
   ```bash
   git add .
   git commit -m "Update description"
   git push
   ```

3. Netlify는 GitHub 저장소의 변경을 감지하고 자동으로 새 버전을 배포합니다.

### 9.2 API 키 갱신

1. 네이버 API 키가 만료되거나 변경된 경우, 네이버 개발자 센터에서 새 키를 발급받습니다.

2. 로컬 개발 환경의 `.env` 파일을 업데이트합니다.

3. Netlify 대시보드에서 환경 변수를 업데이트합니다:
   - "Site settings" > "Build & deploy" > "Environment" > "Environment variables"에서 변수를 편집합니다. 