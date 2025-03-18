// DOM 요소 참조
const keywordForm = document.getElementById('keywordForm');
const keywordInput = document.getElementById('keywordInput');
const fileUpload = document.getElementById('fileUpload');
const fileName = document.getElementById('fileName');
const searchBtn = document.getElementById('searchBtn');
const resetBtn = document.getElementById('resetBtn');
const resultTable = document.getElementById('resultTable');
const resultBody = document.getElementById('resultBody');
const loadingOverlay = document.getElementById('loadingOverlay');
const alertContainer = document.getElementById('alertContainer');
const downloadBtn = document.getElementById('downloadBtn');
const fullCheckbox = document.getElementById('fullCheck');
const detailPopup = document.getElementById('detailPopup');
const popupClose = document.getElementById('popupClose');
const chartContainer = document.getElementById('chartContainer');

// 전역 변수
let searchResults = [];
let chartInstance = null;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  showEmptyResultMessage();
});

// 이벤트 리스너 초기화
function initEventListeners() {
  // 키워드 검색 폼 제출
  keywordForm.addEventListener('submit', handleFormSubmit);
  
  // 파일 업로드 처리
  fileUpload.addEventListener('change', handleFileUpload);
  
  // 리셋 버튼
  resetBtn.addEventListener('click', resetForm);
  
  // 전체 선택 체크박스
  if (fullCheckbox) {
    fullCheckbox.addEventListener('change', toggleAllCheckboxes);
  }
  
  // 다운로드 버튼
  if (downloadBtn) {
    downloadBtn.addEventListener('click', downloadResults);
  }
  
  // 팝업 닫기 버튼
  if (popupClose) {
    popupClose.addEventListener('click', closeDetailPopup);
  }
}

// 폼 제출 처리
async function handleFormSubmit(event) {
  event.preventDefault();
  
  // 키워드 가져오기
  const keywords = keywordInput.value.trim();
  
  if (!keywords) {
    showAlert('키워드를 입력하세요.', 'danger');
    return;
  }
  
  // 특수 문자 검사
  if (checkSpecialCharacters(keywords)) {
    showAlert('키워드에 사용할 수 없는 특수문자가 포함되어 있습니다.', 'danger');
    return;
  }
  
  // 키워드 개수 제한 (최대 5개)
  const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k);
  if (keywordArray.length > 5) {
    showAlert('한 번에 최대 5개의 키워드만 검색할 수 있습니다.', 'warning');
    return;
  }
  
  // 검색 시작
  await searchKeywords(keywords);
}

// 특수 문자 검사
function checkSpecialCharacters(str) {
  const specialPattern = /['"\\]/;
  return specialPattern.test(str);
}

// 파일 업로드 처리
function handleFileUpload(event) {
  const file = event.target.files[0];
  
  if (!file) {
    fileName.value = '';
    return;
  }
  
  // 파일 확장자 검사
  const fileExt = file.name.split('.').pop().toLowerCase();
  if (!['xls', 'xlsx', 'csv', 'txt'].includes(fileExt)) {
    showAlert('xls, xlsx, csv, txt 파일만 업로드 가능합니다.', 'danger');
    fileUpload.value = '';
    fileName.value = '';
    return;
  }
  
  fileName.value = file.name;
  
  // 파일 내용 읽기
  if (['csv', 'txt'].includes(fileExt)) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const content = e.target.result;
      const lines = content.split(/\r\n|\n/).filter(line => line.trim());
      
      if (lines.length > 100) {
        showAlert('최대 100개의 키워드만 처리할 수 있습니다.', 'warning');
        return;
      }
      
      keywordInput.value = lines.join(',');
    };
    reader.readAsText(file);
  } else {
    showAlert('엑셀 파일은 현재 지원되지 않습니다. CSV나 TXT 파일을 사용해주세요.', 'info');
  }
}

// 키워드 검색 실행
async function searchKeywords(keywords) {
  try {
    // 로딩 표시
    showLoading(true);
    
    console.log('키워드 검색 시작:', keywords);
    
    // API 호출
    const response = await fetch('/.netlify/functions/keywordSearch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ DataQ: keywords })
    });
    
    console.log('API 응답 상태:', response.status, response.statusText);
    
    // 응답 처리
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API 오류 응답:', errorText);
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || '검색 중 오류가 발생했습니다.');
      } catch (e) {
        throw new Error(`검색 중 오류가 발생했습니다. 상태 코드: ${response.status}`);
      }
    }
    
    const data = await response.json();
    console.log('API 응답 데이터:', data);
    
    if (!data.success) {
      throw new Error(data.error || '검색 결과를 가져오지 못했습니다.');
    }
    
    // 결과 저장 및 표시
    searchResults = data.results;
    displayResults(searchResults);
    
    // 성공 메시지
    showAlert(`${data.count}개의 키워드 검색이 완료되었습니다.`, 'success');
  } catch (error) {
    console.error('검색 오류:', error);
    showAlert(error.message, 'danger');
    showEmptyResultMessage();
  } finally {
    // 로딩 숨기기
    showLoading(false);
  }
}

// 결과 표시
function displayResults(results) {
  // 결과 테이블 초기화
  resultBody.innerHTML = '';
  
  if (!results || results.length === 0) {
    showEmptyResultMessage();
    return;
  }
  
  // 각 결과에 대한 행 추가
  results.forEach((result, index) => {
    const row = document.createElement('tr');
    row.setAttribute('data-keyword', result.keyword);
    row.setAttribute('data-pc', result.pcSearchVolume);
    row.setAttribute('data-mobile', result.mobileSearchVolume);
    row.setAttribute('data-total', result.totalSearchVolume);
    
    // 체크박스 및 번호
    row.innerHTML = `
      <td><input type="checkbox" name="data_check[]" value="${result.keyword}"></td>
      <td class="number">${index + 1}</td>
      <td style="text-align:center">
        <a href="https://search.naver.com/search.naver?query=${encodeURIComponent(result.keyword)}" target="_blank">
          ${result.keyword}
          <img src="https://raw.githubusercontent.com/ubermans/keyword/main/images/search-icon.png" class="btn-ico" alt="검색">
        </a>
      </td>
      <td style="text-align:right">${formatNumber(result.pcSearchVolume)}</td>
      <td style="text-align:right">${formatNumber(result.mobileSearchVolume)}</td>
      <td style="text-align:right">${formatNumber(result.totalSearchVolume)}</td>
      <td class="monthBlog" style="text-align:right">${formatNumber(result.monthlyBlogRate)}</td>
      <td class="blogSaturation" style="text-align:center">${result.blogSaturation}</td>
      <td class="shopCategory" style="text-align:center">${result.shopCategory}</td>
      <td style="text-align:right">${formatNumber(result.webTotal)}</td>
      <td style="text-align:right">${formatNumber(result.blogTotal)}</td>
      <td style="text-align:center">${result.competition}</td>
      <td style="text-align:center">${result.commercial}</td>
      <td style="text-align:center">${result.clickRate}</td>
      <td style="text-align:center">
        <button type="button" class="btn-detail" onclick="showDetailPopup('${result.keyword}', ${result.pcSearchVolume}, ${result.mobileSearchVolume})">상세</button>
      </td>
    `;
    
    resultBody.appendChild(row);
  });
}

// 빈 결과 메시지 표시
function showEmptyResultMessage() {
  resultBody.innerHTML = `
    <tr class="null_tr">
      <td colspan="15" class="null_td">키워드를 조회하십시오.</td>
    </tr>
  `;
}

// 숫자 포맷팅 (천 단위 콤마)
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// 알림 메시지 표시
function showAlert(message, type = 'info') {
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = message;
  
  // 기존 알림 제거
  alertContainer.innerHTML = '';
  alertContainer.appendChild(alert);
  
  // 3초 후 알림 자동 제거
  setTimeout(() => {
    alert.remove();
  }, 3000);
}

// 로딩 표시 토글
function showLoading(show) {
  loadingOverlay.style.display = show ? 'flex' : 'none';
}

// 폼 초기화
function resetForm() {
  keywordInput.value = '';
  fileUpload.value = '';
  fileName.value = '';
  showEmptyResultMessage();
}

// 전체 체크박스 토글
function toggleAllCheckboxes() {
  const checkboxes = document.querySelectorAll('input[name="data_check[]"]');
  checkboxes.forEach(checkbox => {
    checkbox.checked = fullCheckbox.checked;
  });
}

// 결과 다운로드
function downloadResults() {
  const checkboxes = document.querySelectorAll('input[name="data_check[]"]:checked');
  
  if (checkboxes.length === 0) {
    showAlert('다운로드할 항목을 선택하세요.', 'warning');
    return;
  }
  
  // 선택된 키워드 결과 필터링
  const selectedKeywords = Array.from(checkboxes).map(cb => cb.value);
  const selectedResults = searchResults.filter(result => selectedKeywords.includes(result.keyword));
  
  // CSV 데이터 생성
  let csvContent = '키워드,PC 검색량,모바일 검색량,총 검색량,월간 블로그 발행량,블로그 포화도,쇼핑 카테고리,웹 검색 결과,블로그 검색 결과,경쟁강도,상업성,클릭률\n';
  
  selectedResults.forEach(result => {
    csvContent += `"${result.keyword}",${result.pcSearchVolume},${result.mobileSearchVolume},${result.totalSearchVolume},${result.monthlyBlogRate},"${result.blogSaturation}","${result.shopCategory}",${result.webTotal},${result.blogTotal},"${result.competition}","${result.commercial}","${result.clickRate}"\n`;
  });
  
  // 다운로드 링크 생성
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `keyword_results_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 상세 정보 팝업 표시
function showDetailPopup(keyword, pcVolume, mobileVolume) {
  const totalVolume = pcVolume + mobileVolume;
  
  // 팝업 제목 설정
  document.getElementById('popupTitle').textContent = `키워드: ${keyword}`;
  
  // 검색량 데이터 표시
  document.getElementById('pcVolume').textContent = formatNumber(pcVolume);
  document.getElementById('mobileVolume').textContent = formatNumber(mobileVolume);
  document.getElementById('totalVolume').textContent = formatNumber(totalVolume);
  
  // 차트 생성
  createChart(keyword, pcVolume, mobileVolume);
  
  // 팝업 표시
  detailPopup.style.display = 'flex';
}

// 팝업 닫기
function closeDetailPopup() {
  detailPopup.style.display = 'none';
  
  // 차트 인스턴스 정리
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
}

// 차트 생성
function createChart(keyword, pcVolume, mobileVolume) {
  const ctx = document.getElementById('volumeChart').getContext('2d');
  
  // 기존 차트 정리
  if (chartInstance) {
    chartInstance.destroy();
  }
  
  // 월별 데이터 생성 (예시 데이터)
  const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const pcData = [];
  const mobileData = [];
  
  // 랜덤 변동을 주어 월별 데이터 생성 (실제로는 API에서 받아와야 함)
  for (let i = 0; i < 12; i++) {
    const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 ~ 1.2 사이의 랜덤 값
    pcData.push(Math.round(pcVolume * randomFactor));
    mobileData.push(Math.round(mobileVolume * randomFactor));
  }
  
  // 차트 생성
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [
        {
          label: 'PC 검색량',
          data: pcData,
          borderColor: '#4285f4',
          backgroundColor: 'rgba(66, 133, 244, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        },
        {
          label: '모바일 검색량',
          data: mobileData,
          borderColor: '#34a853',
          backgroundColor: 'rgba(52, 168, 83, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: `${keyword} - 월별 검색량 추이 (예상)`
        },
        tooltip: {
          mode: 'index',
          intersect: false
        },
        legend: {
          position: 'top'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatNumber(value);
            }
          }
        }
      }
    }
  });
}

// 전역 함수로 노출 (HTML에서 직접 호출하기 위함)
window.showDetailPopup = showDetailPopup; 