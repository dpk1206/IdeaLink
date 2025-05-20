document.addEventListener("DOMContentLoaded", () => {
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

// answer_btn 클래스를 가진 모든 요소에 이벤트 등록
document.querySelectorAll('.answer_btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const container = document.querySelector('.submit_container');
    if (container) {
      // 토글 동작
      if (container.style.display === 'none' || getComputedStyle(container).display === 'none') {
        container.style.display = 'block';
        // 화면을 .submit_container로 스크롤 이동
        container.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        container.style.display = 'none';
      }
    }
  });
});

