// 문서가 로드되면 실행
document.addEventListener('DOMContentLoaded', () => {
    // 요소 참조
    const keywordForm = document.getElementById('keywordForm');
    const relatedForm = document.getElementById('relatedForm');
    const keywordInput = document.getElementById('keywordInput');
    const relatedInput = document.getElementById('relatedInput');
    const resultsContainer = document.getElementById('results');
    const resultActions = document.getElementById('resultActions');
    const downloadCsvBtn = document.getElementById('downloadCsv');
    
    // 현재 결과 데이터 (CSV 다운로드용)
    let currentResultData = null;
    
    // API 엔드포인트 (Netlify Functions 주소)
    const API_BASE_URL = '/.netlify/functions';
    
    // 키워드 검색 폼 제출 이벤트
    keywordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // 입력 키워드 가져오기 및 처리
        const keywordText = keywordInput.value.trim();
        if (!keywordText) {
            showAlert('키워드를 입력해주세요.', 'danger');
            return;
        }
        
        // 키워드 분할 (줄바꿈 또는 쉼표)
        const keywords = keywordText
            .split(/[\n,]+/)
            .map(k => k.trim())
            .filter(k => k.length > 0);
        
        // 최대 100개 제한
        if (keywords.length > 100) {
            showAlert('키워드는 최대 100개까지 입력 가능합니다.', 'warning');
            return;
        }
        
        // 검색 수행
        await searchKeywords(keywords);
    });
    
    // 연관 키워드 폼 제출 이벤트
    relatedForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const keyword = relatedInput.value.trim();
        if (!keyword) {
            showAlert('키워드를 입력해주세요.', 'danger');
            return;
        }
        
        // 연관 키워드 검색 수행
        await searchRelatedKeywords(keyword);
    });
    
    // CSV 다운로드 버튼 이벤트
    downloadCsvBtn.addEventListener('click', () => {
        if (currentResultData && currentResultData.length > 0) {
            downloadCsv(currentResultData);
        }
    });
    
    // 키워드 검색 함수
    async function searchKeywords(keywords) {
        try {
            showLoading();
            
            // API 호출
            const response = await fetch(`${API_BASE_URL}/keyword`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ keywords })
            });
            
            if (!response.ok) {
                throw new Error('API 요청 실패');
            }
            
            const data = await response.json();
            
            if (!data.results || data.results.length === 0) {
                showAlert('검색 결과가 없습니다.', 'info');
                return;
            }
            
            // 결과 표시
            currentResultData = data.results;
            displayKeywordResults(data.results);
            
            // 다운로드 버튼 표시
            resultActions.classList.remove('d-none');
            
        } catch (error) {
            console.error('검색 오류:', error);
            showAlert('검색 중 오류가 발생했습니다.', 'danger');
        } finally {
            hideLoading();
        }
    }
    
    // 연관 키워드 검색 함수
    async function searchRelatedKeywords(keyword) {
        try {
            showLoading();
            
            // API 호출
            const response = await fetch(`${API_BASE_URL}/related-keywords`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ keyword })
            });
            
            if (!response.ok) {
                throw new Error('API 요청 실패');
            }
            
            const data = await response.json();
            
            if (!data.results || data.results.length === 0) {
                showAlert('연관 키워드 검색 결과가 없습니다.', 'info');
                return;
            }
            
            // 결과 표시
            currentResultData = data.results;
            displayRelatedKeywordResults(data.results, keyword);
            
            // 다운로드 버튼 표시
            resultActions.classList.remove('d-none');
            
        } catch (error) {
            console.error('연관 키워드 검색 오류:', error);
            showAlert('검색 중 오류가 발생했습니다.', 'danger');
        } finally {
            hideLoading();
        }
    }
    
    // 키워드 검색 결과 표시 함수
    function displayKeywordResults(results) {
        const html = `
            <h3>키워드 검색 결과 (${results.length}개)</h3>
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead>
                        <tr>
                            <th>순번</th>
                            <th>키워드</th>
                            <th>PC 월간검색수</th>
                            <th>모바일 월간검색수</th>
                            <th>검색수합계</th>
                            <th>경쟁정도</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${results.map((item, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${item.keyword}</td>
                                <td>${formatNumber(item.pcMonthlyQcCnt)}</td>
                                <td>${formatNumber(item.mobileMonthlyQcCnt)}</td>
                                <td>${formatNumber(item.totalMonthlyQcCnt)}</td>
                                <td><span class="${getCompetitionClass(item.compIdx)}">${item.compIdx}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        resultsContainer.innerHTML = html;
    }
    
    // 연관 키워드 검색 결과 표시 함수
    function displayRelatedKeywordResults(results, mainKeyword) {
        const html = `
            <h3>"${mainKeyword}" 연관 키워드 검색 결과 (${results.length}개)</h3>
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead>
                        <tr>
                            <th>순번</th>
                            <th>연관 키워드</th>
                            <th>PC 월간검색수</th>
                            <th>모바일 월간검색수</th>
                            <th>검색수합계</th>
                            <th>경쟁정도</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${results.map((item, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${item.relKeyword}</td>
                                <td>${formatNumber(item.pcMonthlyQcCnt)}</td>
                                <td>${formatNumber(item.mobileMonthlyQcCnt)}</td>
                                <td>${formatNumber(item.totalMonthlyQcCnt)}</td>
                                <td><span class="${getCompetitionClass(item.compIdx)}">${item.compIdx}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        resultsContainer.innerHTML = html;
    }
    
    // 경쟁 정도에 따른 CSS 클래스 반환
    function getCompetitionClass(competition) {
        if (competition === '낮음') return 'competition-low';
        if (competition === '보통') return 'competition-medium';
        if (competition === '높음') return 'competition-high';
        return '';
    }
    
    // 알림 표시 함수
    function showAlert(message, type = 'info') {
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        
        resultsContainer.innerHTML = alertHtml;
        resultActions.classList.add('d-none');
    }
    
    // 로딩 표시 함수
    function showLoading() {
        resultsContainer.classList.add('loading');
        resultsContainer.innerHTML = `
            <div class="text-center my-5">
                <div class="loading-spinner mb-3"></div>
                <p>키워드 정보를 검색 중입니다...</p>
            </div>
        `;
    }
    
    // 로딩 숨김 함수
    function hideLoading() {
        resultsContainer.classList.remove('loading');
    }
    
    // 숫자 포맷 함수 (천 단위 쉼표)
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    
    // CSV 다운로드 함수
    function downloadCsv(data) {
        if (!data || data.length === 0) return;
        
        // CSV 헤더 결정 (키워드 결과인지 연관 키워드 결과인지)
        const isKeywordResult = 'keyword' in data[0];
        
        // CSV 헤더
        const headers = isKeywordResult 
            ? ['순번', '키워드', 'PC 월간검색수', '모바일 월간검색수', '검색수합계', '경쟁정도']
            : ['순번', '연관 키워드', 'PC 월간검색수', '모바일 월간검색수', '검색수합계', '경쟁정도'];
        
        // CSV 데이터 생성
        let csvContent = headers.join(',') + '\n';
        
        data.forEach((item, index) => {
            const keywordField = isKeywordResult ? item.keyword : item.relKeyword;
            const row = [
                index + 1,
                `"${keywordField}"`,
                item.pcMonthlyQcCnt,
                item.mobileMonthlyQcCnt,
                item.totalMonthlyQcCnt,
                item.compIdx
            ];
            csvContent += row.join(',') + '\n';
        });
        
        // CSV 파일 생성 및 다운로드
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        // 현재 날짜를 파일명에 포함
        const now = new Date();
        const dateStr = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
        
        link.setAttribute('href', url);
        link.setAttribute('download', `keyword_data_${dateStr}.csv`);
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}); 