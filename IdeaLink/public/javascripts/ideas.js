// 더미 아이디어 데이터
const ideas = [
  {
    id: 1,
    title: "혁신적인 스마트폰 케이스",
    author: "user01",
    date: "2025-03-22",
    views: 150,
    hasDocument: true,
    hasImage: false,
    category: "전기/전자/정보통신",
    dealType: "판매",
    price: 50000
  },
  {
    id: 2,
    title: "자동 개폐형 우산 아이디어",
    author: "user02",
    date: "2025-03-21",
    views: 98,
    hasDocument: true,
    hasImage: true,
    category: "패션/잡화/뷰티",
    dealType: "구매",
    price: 30000
  },
  {
    id: 3,
    title: "맞춤형 건강식품 정기배송 서비스",
    author: "user03",
    date: "2025-03-20",
    views: 200,
    hasDocument: true,
    hasImage: true,
    category: "식자재/식음료/기호제품",
    dealType: "판매",
    price: 80000
  },
  {
    id: 4,
    title: "AI 기반 자동 번역 펜",
    author: "user04",
    date: "2025-03-19",
    views: 180,
    hasDocument: true,
    hasImage: true,
    category: "기계/에너지",
    dealType: "판매",
    price: 65000
  },
  {
    id: 5,
    title: "스마트 조명 제어 시스템",
    author: "user05",
    date: "2025-03-18",
    views: 120,
    hasDocument: false,
    hasImage: true,
    category: "생활/주방/육아",
    dealType: "구매",
    price: 40000
  }
];

function renderIdeas() {
  const tbody = document.getElementById("ideaList");
  tbody.innerHTML = "";

  const fileTypes = Array.from(document.querySelectorAll("input[name='fileType']:checked")).map(el => el.value);
  const categories = Array.from(document.querySelectorAll("input[name='category']:checked")).map(el => el.value);
  const dealType = document.querySelector("input[name='dealType']:checked")?.value || "all";
  const searchType = document.getElementById("searchType").value;
  const searchInput = document.getElementById("searchInput").value.toLowerCase();

  const urlParams = new URLSearchParams(window.location.search);
  const presetCategory = urlParams.get("category");
  if (presetCategory && presetCategory !== "all") {
    document.querySelectorAll("input[name='category']").forEach(input => {
      if (input.value === presetCategory) {
        input.checked = true;
      }
    });
  }

  const filtered = ideas.filter(idea => {
    if (fileTypes.length) {
      const hasDoc = idea.hasDocument;
      const hasImg = idea.hasImage;
      if (fileTypes.includes("문서") && !hasDoc) return false;
      if (fileTypes.includes("이미지") && !hasImg) return false;
    }

    if (categories.length && !categories.includes(idea.category)) return false;

    if (dealType !== "all" && idea.dealType !== dealType) return false;

    if (searchInput) {
      if (searchType === "title" && !idea.title.toLowerCase().includes(searchInput)) return false;
      if (searchType === "author" && !idea.author.toLowerCase().includes(searchInput)) return false;
    }

    return true;
  });

  const thead = document.querySelector(".idea_table thead");
  if (thead) {
    thead.innerHTML = `
      <tr>
        <th>번호</th>
        <th>제목</th>
        <th>작성자</th>
        <th>거래유형</th>
        <th>가격</th>
        <th>날짜</th>
      </tr>
    `;
  }

  filtered.forEach((idea, index) => {
    const row = document.createElement("tr");
    row.onclick = () => location.href = `idea_detail.html?id=${idea.id}`;
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${idea.title}</td>
      <td>${idea.author}</td>
      <td>${idea.dealType}</td>
      <td>${idea.price.toLocaleString()}원</td>
      <td>${idea.date}</td>
    `;
    tbody.appendChild(row);
  });
}

function searchIdeas() {
  renderIdeas();
}

// 필터 변경 시 실시간 반영
const filterInputs = document.querySelectorAll("input[name='fileType'], input[name='category'], input[name='dealType']");
filterInputs.forEach(input => input.addEventListener("change", renderIdeas));

document.addEventListener("DOMContentLoaded", () => {
  renderIdeas();

  const categoryTrack = document.getElementById("categoryTrack");
  const leftArrow = document.getElementById("category-left");
  const rightArrow = document.getElementById("category-right");

  if (categoryTrack && leftArrow && rightArrow) {
    leftArrow.addEventListener("click", () => {
      categoryTrack.scrollBy({ left: -300, behavior: "smooth" });
    });
    rightArrow.addEventListener("click", () => {
      categoryTrack.scrollBy({ left: 300, behavior: "smooth" });
    });
  }
});
