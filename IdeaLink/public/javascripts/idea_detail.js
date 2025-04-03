// 아이디어 상세 페이지 JS

// 1. URL 파라미터에서 ID 가져오기
const params = new URLSearchParams(window.location.search);
const ideaId = params.get("id");

if (!ideaId) {
  alert("잘못된 접근입니다. 목록으로 이동합니다.");
  location.href = "/";
}

// 2. (추후 구현) 서버에서 ideaId 기반으로 데이터 불러오기
if (ideaId === "999") {
  alert("비공개 아이디어입니다. 목록으로 이동합니다.");
  location.href = "/";
}

// 3. 좋아요 버튼
const likeBtn = document.getElementById("likeBtn");
let liked = false;

if (likeBtn) {
  likeBtn.addEventListener("click", () => {
    liked = !liked;
    likeBtn.textContent = liked ? "❤️ 좋아요 취소" : "🤍 좋아요";
    // 서버에 전송 로직 필요
  });
}

// 4. 신고 버튼
const reportBtn = document.getElementById("reportBtn");

if (reportBtn) {
  reportBtn.addEventListener("click", () => {
    if (confirm("이 아이디어를 신고하시겠습니까?")) {
      alert("신고가 접수되었습니다.");
      // 서버 전송 로직 필요
    }
  });
}

// 5. 댓글 등록
const submitComment = document.getElementById("submitComment");
const commentInput = document.getElementById("commentInput");
const commentList = document.querySelector(".comment-list");

if (submitComment && commentInput && commentList) {
  submitComment.addEventListener("click", () => {
    const comment = commentInput.value.trim();
    if (comment) {
      const li = document.createElement("li");
      li.innerHTML = `<strong>you</strong> : ${comment}`;
      commentList.appendChild(li);
      commentInput.value = "";
    }
  });
}
