import React from 'react';
import KeywordSearch from './components/KeywordSearch';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>네이버 키워드 검색량 조회 서비스</h1>
      </header>
      <main>
        <KeywordSearch />
      </main>
      <footer>
        <p>© {new Date().getFullYear()} 네이버 키워드 검색량 조회 서비스</p>
        <p>* 이 서비스는 네이버 광고 API를 사용합니다. 정확한 데이터는 네이버 광고를 참고하세요.</p>
      </footer>
    </div>
  );
}

export default App; 