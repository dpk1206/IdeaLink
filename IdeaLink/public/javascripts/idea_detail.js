document.addEventListener("userReady", (e) => {
  console.log("userReady 이벤트");
  const user_id = e.detail.user_id;
  console.log("유저 ID:", user_id);
});

document.addEventListener("DOMContentLoaded", (e) => {

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
