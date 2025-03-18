import React, { useState } from 'react';
import axios from 'axios';
import './KeywordSearch.css';

const KeywordSearch = () => {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!keyword.trim()) {
      setError('검색할 키워드를 입력해주세요.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Netlify 함수 호출
      const response = await axios.post('/api/keyword-search', { 
        keyword: keyword.trim() 
      });
      
      setResults(response.data);
      
      if (response.data.length === 0) {
        setError('검색 결과가 없습니다.');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // CSV 파일 다운로드 함수
  const handleDownloadCSV = () => {
    if (results.length === 0) return;
    
    const headers = ['키워드', '검색량', '경쟁정도'];
    const csvContent = [
      headers.join(','),
      ...results.map(item => 
        [item.keyword, item.searchVolume, item.competition].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `키워드_검색결과_${keyword}.csv`;
    link.click();
  };

  return (
    <div className="keyword-search">
      <h2>키워드 조회기</h2>
      <p>네이버 키워드의 검색량과 연관 키워드를 쉽게 조회하세요!</p>
      
      <form onSubmit={handleSearch}>
        <div className="search-container">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="검색할 키워드를 입력하세요"
          />
          <button type="submit" disabled={loading}>
            {loading ? '검색 중...' : '검색하기'}
          </button>
        </div>
      </form>

      {error && <div className="error-message">{error}</div>}
      
      {results.length > 0 && (
        <div className="results-container">
          <table>
            <thead>
              <tr>
                <th>키워드</th>
                <th>검색량</th>
                <th>경쟁정도</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => (
                <tr key={index}>
                  <td>{result.keyword}</td>
                  <td>{result.searchVolume}</td>
                  <td>{result.competition}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <button 
            className="csv-download"
            onClick={handleDownloadCSV}
          >
            CSV 다운로드
          </button>
        </div>
      )}
    </div>
  );
};

export default KeywordSearch; 