document.addEventListener("DOMContentLoaded", () => {
  // 로그인 확인
  const token = localStorage.getItem("token");
  if (!token) {
    alert("로그인이 필요합니다.");
    location.href = "/login_signup";
    return; // 이후 코드 실행 방지
  }
});

window.addEventListener("userReady", (e) => {
  if (!e.detail) {
    // 로그인 정보가 없으므로 로그인 페이지로 이동
    alert("로그인이 필요합니다.");
    location.href = "/login_signup";
    return; // 이후 코드 실행 방지
  }

  console.log("디테일페이지유저:", e.detail);
  document.getElementById("answer_user_id").value = e.detail.user_id;
  // 이후 로직 실행 (댓글, 좋아요 등)
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


