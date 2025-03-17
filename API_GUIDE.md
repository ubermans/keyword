# 네이버 API 사용 가이드

이 문서는 네이버 검색 API를 활용하여 키워드 검색량을 추정하는 방법에 대해 설명합니다.

## 목차
1. [API 개요](#api-개요)
2. [API 키 정보](#api-키-정보)
3. [API 호출 방법](#api-호출-방법)
4. [검색량 추정 방법](#검색량-추정-방법)
5. [API 응답 해석](#api-응답-해석)
6. [제한 사항](#제한-사항)
7. [문제 해결](#문제-해결)

## API 개요

네이버는 공식적으로 키워드 검색량을 제공하는 API를 제공하지 않습니다. 따라서 이 프로젝트에서는 네이버 검색 API를 활용하여 간접적으로 검색량을 추정합니다.

주요 사용 API:
- 네이버 검색 API (블로그, 웹문서, 뉴스)
- 네이버 쇼핑 검색 API

## API 키 정보

이 프로젝트는 이미 네이버 API 키가 설정되어 있습니다:
- **Client ID**: kcUpxrk46rltNyD4mp5j
- **Client Secret**: qSKhJWoktJ

이 키는 코드에 직접 포함되어 있으므로 별도의 설정이 필요하지 않습니다.

## API 호출 방법

### 기본 API 호출 구조

```javascript
const fetch = require('node-fetch');

async function searchNaver(keyword, apiType) {
  const baseUrl = 'https://openapi.naver.com/v1/search';
  const url = `${baseUrl}/${apiType}?query=${encodeURIComponent(keyword)}&display=100`;
  
  const response = await fetch(url, {
    headers: {
      'X-Naver-Client-Id': 'kcUpxrk46rltNyD4mp5j',
      'X-Naver-Client-Secret': 'qSKhJWoktJ'
    }
  });
  
  return await response.json();
}
```

### 지원되는 API 유형
- `blog`: 블로그 검색
- `webkr`: 웹문서 검색
- `news`: 뉴스 검색
- `shop`: 쇼핑 검색

## 검색량 추정 방법

네이버 검색 API는 직접적인 검색량을 제공하지 않기 때문에, 다음과 같은 방법으로 검색량을 추정합니다:

1. **블로그 검색 결과 활용**:
   - 블로그 검색 API의 `total` 필드를 통해 해당 키워드에 대한 블로그 글 수를 확인
   - 블로그 글 수와 실제 검색량 사이의 상관관계를 분석하여 검색량 추정

2. **웹문서 및 뉴스 검색 결과 활용**:
   - 웹문서와 뉴스 검색 API의 `total` 필드를 통해 해당 키워드에 대한 문서 수 확인
   - 문서 수와 검색량 사이의 관계를 분석하여 검색량 추정

3. **PC와 모바일 검색량 구분**:
   - 모바일 검색은 일반적으로 PC 검색보다 많은 경향이 있음
   - 키워드 특성에 따라 PC:모바일 비율을 조정하여 각각의 검색량 추정

## API 응답 해석

### 블로그 검색 API 응답 예시

```json
{
  "lastBuildDate": "Mon, 01 Jan 2023 12:00:00 +0900",
  "total": 1234,
  "start": 1,
  "display": 10,
  "items": [
    {
      "title": "블로그 제목",
      "link": "블로그 링크",
      "description": "블로그 설명",
      "bloggername": "블로거 이름",
      "bloggerlink": "블로거 링크",
      "postdate": "게시일"
    },
    // ... 더 많은 항목
  ]
}
```

주요 필드:
- `total`: 검색 결과 총 개수 (이 값을 검색량 추정에 활용)
- `items`: 검색 결과 항목 목록

## 제한 사항

1. **API 호출 제한**:
   - 네이버 API는 애플리케이션당 일일 25,000회 호출 제한이 있습니다.
   - 초당 10회 이상 호출 시 429 오류(Too Many Requests)가 발생할 수 있습니다.

2. **검색량 추정의 정확도**:
   - 이 방법은 직접적인 검색량이 아닌 간접적인 추정치를 제공합니다.
   - 실제 검색량과 차이가 있을 수 있으며, 참고용으로만 사용하세요.

3. **API 응답 지연**:
   - 네이버 API는 때때로 응답 지연이 발생할 수 있습니다.
   - 이 프로젝트에서는 최대 3회까지 재시도하는 로직을 구현했습니다.

## 문제 해결

### 일반적인 오류 코드

- **400 Bad Request**: 잘못된 요청 형식
- **401 Unauthorized**: API 키 인증 실패
- **429 Too Many Requests**: 요청 한도 초과
- **500 Internal Server Error**: 서버 오류

### 해결 방법

1. **401 오류 (인증 실패)**:
   - API 키가 올바르게 설정되어 있는지 확인하세요.
   - 네이버 개발자 센터에서 애플리케이션 상태를 확인하세요.

2. **429 오류 (요청 한도 초과)**:
   - 요청 빈도를 줄이고 잠시 후 다시 시도하세요.
   - 이 프로젝트에서는 자동으로 지연 후 재시도합니다.

3. **검색 결과가 0인 경우**:
   - 키워드 철자를 확인하세요.
   - 검색량이 매우 적은 키워드일 수 있습니다.
   - 다른 유사 키워드로 시도해보세요. 