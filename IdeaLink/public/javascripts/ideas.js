// 더미 아이디어 데이터
const ideas = [
  { id: 1, title: "사회복지 혁신 플랫폼", author: "user01", date: "2025-03-10", views: 100, hasDocument: true, hasImage: true, categoryMain: "사회복지", categorySub: "상담", dealType: "판매", price: 50000 },
  { id: 2, title: "문화예술 디지털 전시", author: "user02", date: "2025-03-11", views: 120, hasDocument: true, hasImage: true, categoryMain: "문화·예술·디자인·방송", categorySub: "문화콘텐츠", dealType: "판매", price: 60000 },
  { id: 3, title: "디자인 협업 플랫폼", author: "user03", date: "2025-03-12", views: 80, hasDocument: true, hasImage: false, categoryMain: "문화·예술·디자인·방송", categorySub: "디자인", dealType: "구매", price: 40000 },
  { id: 4, title: "스마트 택시 호출 서비스", author: "user04", date: "2025-03-13", views: 200, hasDocument: false, hasImage: true, categoryMain: "운전·운송", categorySub: "자동차운전·운송", dealType: "판매", price: 45000 },
  { id: 5, title: "철도 승차권 자동화 시스템", author: "user05", date: "2025-03-14", views: 90, hasDocument: true, hasImage: true, categoryMain: "운전·운송", categorySub: "철도운전·운송", dealType: "구매", price: 30000 },
  { id: 6, title: "부동산 매물 자동 매칭", author: "user06", date: "2025-03-15", views: 150, hasDocument: true, hasImage: false, categoryMain: "영업판매", categorySub: "부동산", dealType: "판매", price: 70000 },
  { id: 7, title: "스마트 청소 로봇", author: "user07", date: "2025-03-16", views: 110, hasDocument: false, hasImage: true, categoryMain: "경비·청소", categorySub: "청소", dealType: "판매", price: 55000 },
  { id: 8, title: "관광 추천 플랫폼", author: "user08", date: "2025-03-17", views: 130, hasDocument: true, hasImage: true, categoryMain: "이용·숙박·여행·오락·스포츠", categorySub: "관광·레저", dealType: "구매", price: 48000 },
  { id: 9, title: "스포츠 경기 분석 AI", author: "user09", date: "2025-03-18", views: 140, hasDocument: true, hasImage: true, categoryMain: "이용·숙박·여행·오락·스포츠", categorySub: "스포츠", dealType: "판매", price: 90000 },
  { id: 10, title: "프리미엄 커피 레시피 공유", author: "user10", date: "2025-03-19", views: 90, hasDocument: true, hasImage: false, categoryMain: "음식서비스", categorySub: "식음료조리·서비스", dealType: "판매", price: 35000 },
  { id: 11, title: "친환경 건축자재", author: "user11", date: "2025-03-20", views: 200, hasDocument: true, hasImage: true, categoryMain: "건설", categorySub: "건축", dealType: "판매", price: 120000 },
  { id: 12, title: "스마트 교통 인프라 설계", author: "user12", date: "2025-03-21", views: 95, hasDocument: false, hasImage: true, categoryMain: "건설", categorySub: "도시·교통", dealType: "구매", price: 95000 },
  { id: 13, title: "자동차 부품 스마트 관리", author: "user13", date: "2025-03-22", views: 100, hasDocument: true, hasImage: true, categoryMain: "기계", categorySub: "자동차", dealType: "판매", price: 75000 },
  { id: 14, title: "항공기 부품 모니터링 시스템", author: "user14", date: "2025-03-23", views: 85, hasDocument: true, hasImage: false, categoryMain: "기계", categorySub: "항공기제작", dealType: "구매", price: 65000 },
  { id: 15, title: "친환경 금속소재 개발", author: "user15", date: "2025-03-24", views: 120, hasDocument: true, hasImage: true, categoryMain: "재료", categorySub: "금속재료", dealType: "판매", price: 72000 },
  { id: 16, title: "고성능 세라믹 제조 기술", author: "user16", date: "2025-03-25", views: 100, hasDocument: false, hasImage: true, categoryMain: "재료", categorySub: "세라믹재료", dealType: "판매", price: 82000 },
  { id: 17, title: "스마트 섬유 개발", author: "user17", date: "2025-03-26", views: 130, hasDocument: true, hasImage: true, categoryMain: "섬유·의복", categorySub: "섬유제조", dealType: "구매", price: 67000 },
  { id: 18, title: "패션 AI 스타일 추천", author: "user18", date: "2025-03-27", views: 90, hasDocument: true, hasImage: true, categoryMain: "섬유·의복", categorySub: "패션", dealType: "판매", price: 59000 },
  { id: 19, title: "스마트 전력 관리 시스템", author: "user19", date: "2025-03-28", views: 140, hasDocument: true, hasImage: true, categoryMain: "전기·전자", categorySub: "전기", dealType: "판매", price: 88000 },
  { id: 20, title: "웨어러블 전자기기 개발", author: "user20", date: "2025-03-29", views: 110, hasDocument: true, hasImage: true, categoryMain: "전기·전자", categorySub: "전자기기개발", dealType: "구매", price: 68000 },
  { id: 21, title: "클라우드 기반 정보 보안", author: "user21", date: "2025-03-30", views: 120, hasDocument: false, hasImage: true, categoryMain: "정보통신", categorySub: "정보기술", dealType: "판매", price: 74000 },
  { id: 22, title: "5G 통신망 최적화", author: "user22", date: "2025-03-31", views: 100, hasDocument: true, hasImage: true, categoryMain: "정보통신", categorySub: "통신기술", dealType: "구매", price: 82000 },
  { id: 23, title: "프리미엄 베이커리 레시피", author: "user23", date: "2025-04-01", views: 80, hasDocument: true, hasImage: true, categoryMain: "식품가공", categorySub: "제과·제빵·떡제조", dealType: "판매", price: 42000 },
  { id: 24, title: "3D 인쇄 출판 시스템", author: "user24", date: "2025-04-02", views: 90, hasDocument: true, hasImage: false, categoryMain: "인쇄·목재·가구·공예", categorySub: "인쇄·출판", dealType: "판매", price: 78000 },
  { id: 25, title: "환경 모니터링 IoT", author: "user25", date: "2025-04-03", views: 110, hasDocument: true, hasImage: true, categoryMain: "환경·에너지·안전", categorySub: "산업환경", dealType: "구매", price: 91000 },
  { id: 26, title: "재생에너지 스마트 그리드", author: "user26", date: "2025-04-04", views: 120, hasDocument: true, hasImage: true, categoryMain: "환경·에너지·안전", categorySub: "에너지·자원", dealType: "판매", price: 100000 },
  { id: 27, title: "스마트 농업 모니터링 시스템", author: "user27", date: "2025-04-05", views: 130, hasDocument: true, hasImage: false, categoryMain: "농림어업", categorySub: "농업", dealType: "판매", price: 85000 },
  { id: 28, title: "수산양식 자동화 관리", author: "user28", date: "2025-04-06", views: 95, hasDocument: true, hasImage: true, categoryMain: "농림어업", categorySub: "수산", dealType: "구매", price: 68000 }
];

let currentPage = 1;
const itemsPerPage = 10;

// ✅ 대분류/중분류 매핑
const category_map = {
  "사회복지": ["사회복지", "상담", "교육"],
  "문화·예술·디자인·방송": ["문화·예술", "디자인", "문화콘텐츠"],
  "운전·운송": ["자동차운전·운송", "철도운전·운송", "선박운전·운송", "항공운전·운송"],
  "영업판매": ["영업", "부동산", "판매"],
  "경비·청소": ["경비", "청소"],
  "이용·숙박·여행·오락·스포츠": ["이·미용", "결혼·장례", "관광·레저", "스포츠"],
  "음식서비스": ["식음료조리·서비스"],
  "건설": ["건설공사관리", "토목", "건축", "플랜트", "조경", "도시·교통", "건설기계운전·정비", "해양자원"],
  "기계": ["기계설계", "기계가공", "기계조립·관리", "기계품질관리", "기계장치설치", "자동차", "철도차량제작", "조선", "항공기제작", "금형", "스마트공장(smart factory)"],
  "재료": ["금속재료", "세라믹재료"],
  "섬유·의복": ["섬유제조", "패션", "의복관리"],
  "전기·전자": ["전기", "전자기기일반", "전자기기개발"],
  "정보통신": ["정보기술", "통신기술", "방송기술"],
  "식품가공": ["식품가공", "제과·제빵·떡제조"],
  "인쇄·목재·가구·공예": ["인쇄·출판", "공예"],
  "환경·에너지·안전": ["산업환경", "환경보건", "자연환경", "환경서비스", "에너지·자원", "산업안전보건"],
  "농림어업": ["농업", "축산", "임업", "수산"]
};

function renderIdeas(page = 1) {
  currentPage = page;
  const tbody = document.getElementById("ideaList");
  tbody.innerHTML = "";

  const fileTypes = Array.from(document.querySelectorAll(".file_type_btn.active")).map(btn => btn.dataset.value);
  const dealType = document.querySelector(".deal_type_btn.active")?.dataset.value || "all";
  const searchType = document.getElementById("searchType")?.value;
  const searchInput = document.getElementById("searchInput")?.value.toLowerCase();

  const selectedMainCategory = document.querySelector(".main_category_btn.active")?.textContent || "";
  const selectedSubCategory = document.querySelector(".sub_category_btn.active")?.textContent || "";

  let filtered = ideas.filter(idea => {
    if (fileTypes.length) {
      if (fileTypes.includes("문서") && !idea.hasDocument) return false;
      if (fileTypes.includes("이미지") && !idea.hasImage) return false;
    }
    if (dealType !== "all" && idea.dealType !== dealType) return false;
    if (searchInput) {
      if (searchType === "title" && !idea.title.toLowerCase().includes(searchInput)) return false;
      if (searchType === "author" && !idea.author.toLowerCase().includes(searchInput)) return false;
    }
    if (selectedMainCategory && idea.categoryMain !== selectedMainCategory) return false;
    if (selectedSubCategory && idea.categorySub !== selectedSubCategory) return false;
    return true;
  });

  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedIdeas = filtered.slice(start, end);

  paginatedIdeas.forEach((idea, index) => {
    const row = document.createElement("tr");
    row.onclick = () => location.href = `idea_detail.html?id=${idea.id}`;
    row.innerHTML = `
      <td>${start + index + 1}</td>
      <td>${idea.title}</td>
      <td>${idea.author}</td>
      <td>${idea.dealType}</td>
      <td>${idea.price.toLocaleString()}원</td>
      <td>${idea.date}</td>
      <td>${idea.views}</td>
    `;
    tbody.appendChild(row);
  });

  renderPagination(filtered.length);
}

// 페이지네이션 렌더링
function renderPagination(totalItems) {
  const paginationContainer = document.getElementById("pagination");
  if (!paginationContainer) return;
  paginationContainer.innerHTML = "";

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  for (let i = 1; i <= totalPages; i++) {
    const button = document.createElement("button");
    button.textContent = i;
    button.className = (i === currentPage) ? "active" : "";
    button.onclick = () => {
      renderIdeas(i);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    paginationContainer.appendChild(button);
  }
}

// 대분류/중분류 필터 세팅
function setupCategoryFilters() {
  const mainGroup = document.getElementById("main_category_group");
  const subGroup = document.getElementById("sub_category_group");

  Object.keys(category_map).forEach(mainCategory => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "main_category_btn";
    button.textContent = mainCategory;
    button.onclick = () => {
      document.querySelectorAll(".main_category_btn").forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");

      subGroup.innerHTML = "";
      category_map[mainCategory].forEach(sub => {
        const subBtn = document.createElement("button");
        subBtn.type = "button";
        subBtn.className = "sub_category_btn";
        subBtn.textContent = sub;
        subBtn.onclick = () => {
          document.querySelectorAll(".sub_category_btn").forEach(b => b.classList.remove("active"));
          subBtn.classList.add("active");
          renderIdeas(1);
        };
        subGroup.appendChild(subBtn);
      });
      renderIdeas(1);
    };
    mainGroup.appendChild(button);
  });
}

// 검색
function searchIdeas() {
  renderIdeas(1);
}

// ✅ DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  setupCategoryFilters();

  // 파일유형 버튼 설정
  document.querySelectorAll('.file_type_btn').forEach(button => {
    button.addEventListener('click', () => {
      button.classList.toggle('active');
      renderIdeas(1);
    });
  });

  // 거래유형 버튼 설정
  document.querySelectorAll('.deal_type_btn').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.deal_type_btn').forEach(b => b.classList.remove('active'));
      button.classList.add('active');
      renderIdeas(1);
    });
  });

  // 검색 이벤트
  document.getElementById("searchInput")?.addEventListener("input", () => renderIdeas(1));
  document.getElementById("searchType")?.addEventListener("change", () => renderIdeas(1));

  // 초기화 버튼 이벤트 추가
  document.getElementById("resetFilters").addEventListener("click", () => {
    document.querySelectorAll(".file_type_btn, .deal_type_btn, .main_category_btn, .sub_category_btn")
      .forEach(button => button.classList.remove("active"));

    document.querySelector(".deal_type_btn[data-value='all']").classList.add("active");
    document.getElementById("searchInput").value = "";
    document.getElementById("searchType").value = "title";
    document.getElementById("sub_category_group").innerHTML = "";

    renderIdeas(1);
  });

  // 최근 등록 및 인기 아이디어 렌더링
  const recent = document.getElementById("recent-ideas");
  const popular = document.getElementById("popular-ideas");

  if (recent && popular && typeof ideas !== "undefined") {
    const recentSorted = [...ideas].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
    const popularSorted = [...ideas].sort((a, b) => b.views - a.views).slice(0, 3);

    recent.innerHTML = '';
    popular.innerHTML = '';

    recentSorted.forEach(item => {
      const li = document.createElement("li");
      li.textContent = item.title;
      recent.appendChild(li);
    });

    popularSorted.forEach(item => {
      const li = document.createElement("li");
      li.textContent = item.title;
      popular.appendChild(li);
    });
  }

  // 초기 렌더링
  renderIdeas(1);
});