let currentPage = 1;
const itemsPerPage = 10;
const selectedFileTypes = new Set(); 

// ✅ URL 쿼리 파라미터 변경 후 이동
function updateQueryParams(newParams) {
  const url = new URL(window.location.href);
  Object.keys(newParams).forEach(key => {
    if (newParams[key] === null) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, newParams[key]);
    }
  });
  url.searchParams.set('page', 1); // 필터 바뀌면 1페이지로 초기화
  window.location.href = url.toString();
}

// 페이지네이션 렌더링
function renderPagination(totalItems) {
  const paginationContainer = document.getElementById("pagination");
  if (!paginationContainer) return;
  paginationContainer.innerHTML = "";

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // 현재 URL 파라미터 유지
  const baseParams = new URLSearchParams(window.location.search);

  const currentPageFromURL = parseInt(baseParams.get("page") || "1");
  
  for (let i = 1; i <= totalPages; i++) {
    const button = document.createElement("button");
    button.textContent = i;
    button.className = (i === currentPageFromURL) ? "active" : "";

  button.onclick = () => {
  const newParams = new URLSearchParams(baseParams.toString());
  newParams.set("page", i);

  window.location.href = `${window.location.pathname}?${newParams.toString()}`;
};


    paginationContainer.appendChild(button);
  }
}



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
//대분류 중분류
let selectedMainId = null;
let selectedSubId = null;

function updateQueryParams(newParams) {
  const url = new URL(window.location.href);
  Object.keys(newParams).forEach(key => {
    if (newParams[key] === null) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, newParams[key]);
    }
  });
  url.searchParams.set("page", 1);

  // ✅ URL만 변경하고 새로고침 없이 필터만 적용
  window.history.pushState({}, '', url.toString());

  // ✅ 필터 다시 적용 (예: fetch 데이터, 새로 렌더링 등)
  // renderIdeas(url.searchParams.get('page') || 1); // → 데이터 동적 처리 시
  location.reload(); // 👈 필요 시 리로딩(안 하면 데이터 갱신 안 됨)
}

/**
 * 대분류 카테고리 버튼을 생성하고,
 * URL 파라미터(main_id, sub_id)에 따라 해당 버튼을 활성화함.
 * 대분류 선택 시, 중분류 목록도 동적으로 생성되도록 함.
 */
function setupCategoryFilters() {
  const mainGroup = document.getElementById("main_category_group");
  const subGroup = document.getElementById("sub_category_group");

  // 현재 URL의 파라미터에서 선택된 main_id, sub_id 가져오기
  const urlParams = new URLSearchParams(window.location.search);
  const currentMainId = urlParams.get('main_id');
  const currentSubId = urlParams.get('sub_id');

  // 대분류 목록을 순회하며 버튼 생성
  Object.entries(category_main_id_map).forEach(([mainName, mainId]) => {
    const mainBtn = document.createElement("button");
    mainBtn.textContent = mainName;
    mainBtn.className = "main_category_btn";
    mainBtn.dataset.mainId = mainId;

    // URL 파라미터에 해당하는 대분류가 있다면 버튼을 활성화
    if (mainId.toString() === currentMainId) {
      mainBtn.classList.add("active");
      selectedMainId = mainId;
    }

    // 대분류 클릭 시
    mainBtn.onclick = () => {
      selectedMainId = mainId;
      selectedSubId = null;

      // 기존 활성화된 버튼 초기화 후 클릭된 버튼만 활성화
      document.querySelectorAll(".main_category_btn").forEach(b => b.classList.remove("active"));
      mainBtn.classList.add("active");

      // 중분류 버튼 새로 구성 후 URL 쿼리 갱신
      renderSubCategories(mainId, null);
      updateQueryParams({ main_id: mainId, sub_id: null });
    };

    mainGroup.appendChild(mainBtn);
  });

  // 페이지가 로딩되었을 때 중분류도 자동으로 렌더링
  if (currentMainId) {
    renderSubCategories(currentMainId, currentSubId);
  }
}

/**
 * 특정 대분류에 해당하는 중분류 목록을 생성하고,
 * URL 파라미터(sub_id)에 따라 버튼을 활성화함.
 * 중분류 선택 시 쿼리 갱신.
 */
function renderSubCategories(mainId, selectedSubId) {
  const subGroup = document.getElementById("sub_category_group");
  subGroup.innerHTML = "";

  // 중분류 전체에서 해당 mainId를 가진 것들만 추려서 버튼 생성
  Object.entries(category_sub_id_map).forEach(([subName, subInfo]) => {
    if (subInfo.main_id.toString() === mainId.toString()) {
      const subBtn = document.createElement("button");
      subBtn.textContent = subName;
      subBtn.className = "sub_category_btn";
      subBtn.dataset.subId = subInfo.sub_id;

      // 현재 URL 파라미터와 일치하는 sub_id가 있다면 버튼 활성화
      if (subInfo.sub_id.toString() === selectedSubId) {
        subBtn.classList.add("active");
      }

      // 중분류 클릭 시
      subBtn.onclick = () => {
        document.querySelectorAll(".sub_category_btn").forEach(b => b.classList.remove("active"));
        subBtn.classList.add("active");
        updateQueryParams({ main_id: mainId, sub_id: subInfo.sub_id });
      };

      subGroup.appendChild(subBtn);
    }
  });
}

// 검색
function searchIdeas() {
  const keyword = document.getElementById("searchInput").value.trim();
  const searchType = document.getElementById("searchType").value;

  const params = new URLSearchParams(window.location.search);

  if (keyword) {
    params.set("keyword", keyword);
    params.set("search_type", searchType);
  } else {
    params.delete("keyword");
    params.delete("search_type");
  }

  params.set("page", 1);

  // 새로고침 없이 URL만 바꾸고
  history.pushState({}, "", `${window.location.pathname}?${params.toString()}`);

  // ✅ 리렌더링을 위해 필요 시 아래 함수 호출 (아니면 그냥 location.reload())
  location.reload(); // 서버 렌더링이니까 그냥 이걸로도 충분
}


// ✅ DOM 로딩 후 실행
document.addEventListener('DOMContentLoaded', () => {
  setupCategoryFilters();
    // ✅ 파일유형 유지
  const currentFileType = new URLSearchParams(window.location.search).get('file_type');
  if (currentFileType) {
    document.querySelector(`.file_type_btn[data-value="${currentFileType}"]`)?.classList.add('active');
  }
  // 표시 개수 변경 시
  document.getElementById("itemsLimit")?.addEventListener("change", function () {
    updateQueryParams({ limit: this.value });
  });

 // 파일유형 버튼
const fileTypeParam = new URLSearchParams(window.location.search).get('file_type');
if (fileTypeParam) {
  fileTypeParam.split(',').forEach(type => {
    const btn = document.querySelector(`.file_type_btn[data-value="${type}"]`);
    if (btn) {
      btn.classList.add('active');
      selectedFileTypes.add(type);
    }
  });
}

// ✅ 파일유형 버튼 다중 선택
document.querySelectorAll('.file_type_btn').forEach(button => {
  button.addEventListener('click', () => {
    const value = button.dataset.value;

    if (selectedFileTypes.has(value)) {
      selectedFileTypes.delete(value);
      button.classList.remove('active');
    } else {
      selectedFileTypes.add(value);
      button.classList.add('active');
    }

    // 선택된 file_type을 콤마로 이어붙여 파라미터로 설정
    updateQueryParams({
      file_type: selectedFileTypes.size > 0 ? Array.from(selectedFileTypes).join(',') : null
    });
  });
});

// 거래유형 버튼
 document.querySelectorAll('.deal_type_btn').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.deal_type_btn').forEach(b => b.classList.remove('active'));
    button.classList.add('active');

    const type = button.dataset.value;
    updateQueryParams({ status: type });
  });
});


  // 초기화
  document.getElementById("resetFilters")?.addEventListener("click", () => {
  // 버튼들 스타일 초기화
  document.querySelectorAll(".file_type_btn, .deal_type_btn, .main_category_btn, .sub_category_btn")
    .forEach(button => button.classList.remove("active"));
  document.querySelector(".deal_type_btn[data-value='all']")?.classList.add("active");

  // 검색창 초기화
  document.getElementById("searchInput").value = "";
  document.getElementById("searchType").value = "title";
  document.getElementById("sub_category_group").innerHTML = "";

  // URL 쿼리 파라미터 초기화
  updateQueryParams({
    sub_id: null,
    main_id: null,
    file_type: null,
    status: null,
    keyword: null,
    search_type: null
  });
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
});

// 정렬 버튼
document.querySelectorAll('.sort_type_btn').forEach(button => {
  button.addEventListener('click', () => {
    const selectedSort = button.dataset.value;
    document.querySelectorAll('.sort_type_btn').forEach(b => b.classList.remove('active'));
    button.classList.add('active');

    updateQueryParams({ sort: selectedSort });
  });
});

//인기,최근 아이디어 오른쪽 사이드바 
window.addEventListener("DOMContentLoaded", () => {
  // 최근 등록 아이디어
  fetch("/post/recent_posts")
    .then(res => res.json())
    .then(posts => {
      const ul = document.getElementById("recent-ideas");
      posts.forEach(post => {
        const li = document.createElement("li");
        li.innerHTML = `<a href="/post/idea_detail?post_id=${post.post_id}">${post.title}</a>`;
        ul.appendChild(li);
      });
    });

  // 인기 아이디어
  fetch("/post/popular_posts")
    .then(res => res.json())
    .then(posts => {
      const ol = document.getElementById("popular-ideas");
      posts.forEach(post => {
        const li = document.createElement("li");
        li.innerHTML = `<a href="/post/idea_detail?post_id=${post.post_id}">${post.title}</a>`;
        ol.appendChild(li);
      });
    });
});
