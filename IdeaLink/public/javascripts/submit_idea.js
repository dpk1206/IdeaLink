document.addEventListener("DOMContentLoaded", () => {
  const file_input = document.getElementById("files");
  const file_list = document.getElementById("file_list");
  const main_category_group = document.getElementById("main_category_group");
  const sub_category_placeholder = document.getElementById("sub_category");
  const sub_category_group = document.createElement("div");
  sub_category_group.id = "sub_category_group";
  sub_category_group.className = "category_buttons";
  sub_category_placeholder.replaceWith(sub_category_group);

  const idea_form = document.getElementById("idea_form");
  const price_input = document.getElementById("price");
  const file_buffer = new DataTransfer();

  const category_map = {
    사회복지: ["사회복지", "상담", "교육"],
    "문화·예술·디자인·방송": ["문화·예술", "디자인", "문화콘텐츠"],
    "운전·운송": [
      "자동차운전·운송",
      "철도운전·운송",
      "선박운전·운송",
      "항공운전·운송",
    ],
    영업판매: ["영업", "부동산", "판매"],
    "경비·청소": ["경비", "청소"],
    "이용·숙박·여행·오락·스포츠": [
      "이·미용",
      "결혼·장례",
      "관광·레저",
      "스포츠",
    ],
    음식서비스: ["식음료조리·서비스"],
    건설: [
      "건설공사관리",
      "토목",
      "건축",
      "플랜트",
      "조경",
      "도시·교통",
      "건설기계운전·정비",
      "해양자원",
    ],
    기계: [
      "기계설계",
      "기계가공",
      "기계조립·관리",
      "기계품질관리",
      "기계장치설치",
      "자동차",
      "철도차량제작",
      "조선",
      "항공기제작",
      "금형",
      "스마트공장(smart factory)",
    ],
    재료: ["금속재료", "세라믹재료"],
    "섬유·의복": ["섬유제조", "패션", "의복관리"],
    "전기·전자": ["전기", "전자기기일반", "전자기기개발"],
    정보통신: ["정보기술", "통신기술", "방송기술"],
    식품가공: ["식품가공", "제과·제빵·떡제조"],
    "인쇄·목재·가구·공예": ["인쇄·출판", "공예"],
    "환경·에너지·안전": [
      "산업환경",
      "환경보건",
      "자연환경",
      "환경서비스",
      "에너지·자원",
      "산업안전보건",
    ],
    농림어업: ["농업", "축산", "임업", "수산"],
  };

  // ✅ 전체 중분류 ID 부여
  const sub_category_id_map = {};
  let current_id = 1;
  Object.values(category_map).flat().forEach(sub => {
    sub_category_id_map[sub] = current_id++;
  });

  file_input.addEventListener("change", () => {
    const new_files = Array.from(file_input.files);
    new_files.forEach(file => {
      if (!Array.from(file_buffer.files).some(f => f.name === file.name && f.size === file.size)) {
        file_buffer.items.add(file);
      }
    });
    renderFileList();
  });

  function renderFileList() {
    file_list.innerHTML = "";
    Array.from(file_buffer.files).forEach((file, index) => {
      const li = document.createElement("li");
      li.textContent = file.name;

      const remove_btn = document.createElement("button");
      remove_btn.textContent = "❌";
      Object.assign(remove_btn.style, {
        marginLeft: "10px",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color: "red"
      });

      remove_btn.addEventListener("click", () => {
        file_buffer.items.remove(index);
        renderFileList();
      });

      li.appendChild(remove_btn);
      file_list.appendChild(li);
    });

    file_input.files = file_buffer.files;
  }

  Object.keys(category_map).forEach(main_category => {
    const main_btn = document.createElement("button");
    main_btn.type = "button";
    main_btn.textContent = main_category;
    main_btn.className = "main_category_btn";

    main_btn.addEventListener("click", () => {
      document.querySelectorAll(".main_category_btn").forEach(b => b.classList.remove("active"));
      main_btn.classList.add("active");

      let hidden_main = document.getElementById("selected_main");
      if (!hidden_main) {
        hidden_main = document.createElement("input");
        hidden_main.type = "hidden";
        hidden_main.id = "selected_main";
        hidden_main.name = "main_category";
        idea_form.appendChild(hidden_main);
      }
      hidden_main.value = main_category;

      sub_category_group.innerHTML = "";
      category_map[main_category].forEach(sub_category => {
        const sub_btn = document.createElement("button");
        sub_btn.type = "button";
        sub_btn.textContent = sub_category;
        sub_btn.className = "sub_category_btn";

        sub_btn.addEventListener("click", () => {
          document.querySelectorAll(".sub_category_btn").forEach(b => b.classList.remove("active"));
          sub_btn.classList.add("active");

          let hidden_sub = document.getElementById("selected_sub");
          if (!hidden_sub) {
            hidden_sub = document.createElement("input");
            hidden_sub.type = "hidden";
            hidden_sub.id = "selected_sub";
            hidden_sub.name = "category_id";
            idea_form.appendChild(hidden_sub);
          }
          hidden_sub.value = sub_category_id_map[sub_category];
        });

        sub_category_group.appendChild(sub_btn);
      });
    });

    main_category_group.appendChild(main_btn);
  });

  idea_form.addEventListener("submit", e => {
    e.preventDefault();

    const form_data = new FormData(idea_form);
    const file_types = form_data.getAll("file_type");
    const price_value = price_input.value.trim();
    const selected_main = document.getElementById("selected_main");
    const selected_sub = document.getElementById("selected_sub");

    if (!selected_main?.value) return alert("대분류를 선택해주세요.");
    if (!selected_sub?.value) return alert("중분류를 선택해주세요.");
    if (!price_value || isNaN(price_value) || Number(price_value) <= 0) return alert("가격을 올바르게 입력해주세요.");
    if (file_types.length === 0) return alert("파일 유형을 하나 이상 선택해주세요.");

    console.log("제출된 데이터:", Object.fromEntries(form_data.entries()));
    console.log("파일 유형(중복):", file_types);

    alert("아이디어가 제출되었습니다!");
    idea_form.submit();
  });

  // 태그 리스트 표시
  const tags = ["AI", "헬스케어", "친환경", "자동화", "모빌리티", "스마트팜", "IoT", "UX", "딥러닝"];
  const tag_list = document.getElementById("tag_list");
  tags.forEach(tag => {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = tag;
    tag_list.appendChild(span);
  });
});