document.addEventListener("DOMContentLoaded", () => {
  // 더미 사용자 정보 (로그인 여부 판단용)
  const current_user = {
    nickname: "15" // 로그인 안 했을 경우 null 또는 undefined
  };

  const ideaData = {
    title: "AI 기반 스마트 헬멧",
    author: "홍길동",
    date: "2025-05-02",
    views: 500,
    deal_type: "판매",
    category: "기계 > 헬멧",
    price: 100000,
    file_type: "이미지, 문서",
    summary: "사고 시 뇌 손상을 줄여주는 스마트 센서 헬멧",
    description: "센서 기반으로 충격을 감지하고 자동으로 구조 요청을 전송하는 스마트 헬멧입니다.",
    attachments: ["썸네일1.png", "파일2.pdf"]
  };

  // HTML에 데이터 채우기
  document.getElementById("idea_title").textContent = ideaData.title;
  document.getElementById("author").textContent = `작성자: ${ideaData.author}`;
  document.getElementById("date").textContent = ideaData.date;
  document.getElementById("views").textContent = `조회수: ${ideaData.views}`;
  document.getElementById("deal_type").textContent = ideaData.deal_type;
  document.getElementById("category").textContent = ideaData.category;
  document.getElementById("price").textContent = `${ideaData.price.toLocaleString()}원`;
  document.getElementById("file_type").textContent = ideaData.file_type;
  document.getElementById("summary_text").textContent = ideaData.summary;
  document.getElementById("description_text").textContent = ideaData.description;

  // 첨부파일 썸네일 처리
  const container = document.getElementById("file_container");
  ideaData.attachments.forEach(file => {
    const div = document.createElement("div");
    div.className = "file_thumbnail";

    if (file.endsWith(".png") || file.endsWith(".jpg") || file.endsWith(".jpeg")) {
      const img = document.createElement("img");
      img.src = `uploads/${file}`; // 실제 경로에 맞게 수정 필요
      img.alt = file;
      img.className = "file_image";
      div.appendChild(img);
    } else {
      div.innerHTML = `<span class="file_icon">📄</span> ${file}`;
    }

    container.appendChild(div);
  });

  // 좋아요 토글 기능
  const likeBtn = document.getElementById("like_btn");
  const likeCount = document.getElementById("like_count");
  let liked = false;

  likeBtn.addEventListener("click", () => {
    let count = parseInt(likeCount.textContent, 10);

    if (liked) {
      likeCount.textContent = count - 1;
      likeBtn.classList.remove("liked");
      liked = false;
    } else {
      likeCount.textContent = count + 1;
      likeBtn.classList.add("liked");
      liked = true;
    }
  });

  // 신고 기능
  document.getElementById("report_btn").addEventListener("click", () => {
    const reason = prompt("신고 사유를 입력하세요:");
    if (reason) {
      alert("신고가 접수되었습니다.");
    }
  });

  // 댓글 작성 기능
  document.getElementById("comment_submit").addEventListener("click", () => {
    const input = document.getElementById("comment_input");
    const comment = input.value.trim();
    if (comment) {
      const list = document.getElementById("comment_list");
      const li = document.createElement("li");
      const nickname = current_user?.nickname || "익명";
      li.innerHTML = `<strong>${nickname}:</strong> ${comment}`;
      list.appendChild(li);
      input.value = "";
    }
  });
});
