document.addEventListener("DOMContentLoaded", () => {
  // 현재 게시글 ID 가져오기
  const post_id = new URLSearchParams(window.location.search).get("post_id");

  // 댓글 불러오기
async function loadComments() {
  const res = await fetch(`/post/get_comments?post_id=${post_id}`);
  if (!res.ok) return alert("댓글 불러오기 실패");

  const comments = await res.json();
  const list = document.getElementById("comment_list");
  list.innerHTML = ""; // 기존 댓글 초기화

  comments.forEach(c => {
   const li = document.createElement("li");
    li.setAttribute("data-id", c.comment_id);
    li.innerHTML = ''; // 혹시 모를 중복 초기화

    let html = `
        <div class="comment_row">
          <div class="comment_content">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <strong>${c.nick_name}님</strong>
              <small class="comment_date">${new Date(c.created_at).toLocaleString()}</small>
            </div>
            <div class="text">${c.content}</div>
          </div>
          ${String(currentUserId) === String(c.user_id) ? `
            <div class="comment_actions">
              <button class="edit_btn">수정</button>
              <button class="delete_btn">삭제</button>
            </div>
          ` : ''}
        </div>
      `;


    html += `</div>`; // comment_row 닫기
    li.innerHTML = html;
    list.appendChild(li);
  });

  bindEditDeleteEvents();
}


  loadComments(); // 페이지 로드 시 댓글 불러오기

  // 댓글 작성
  document.getElementById("comment_submit").addEventListener("click", async () => {
    const input = document.getElementById("comment_input");
    const content = input.value.trim();
    if (!content) return alert("댓글을 입력하세요.");

    try {
      const res = await fetch("/post/add_comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id, content })
      });

      const result = await res.json();
      if (res.ok) {
        input.value = "";
        await loadComments(); // 댓글 목록 다시 불러오기
      } else {
        alert(result.error || "댓글 등록 실패");
      }
    } catch (err) {
      console.error("댓글 등록 오류:", err);
      alert("댓글 등록 중 오류 발생");
    }
  });

// 댓글 수정 및 삭제 이벤트 바인딩
  function bindEditDeleteEvents() {
  document.querySelectorAll(".edit_btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const li = e.target.closest("li");
      const commentId = li.getAttribute("data-id");
      const contentSpan = li.querySelector(".comment_content");
      const oldContent = contentSpan.textContent;
      const newContent = prompt("수정할 내용을 입력하세요", oldContent);
      if (!newContent || newContent.trim() === "") return;

      const res = await fetch("/post/edit_comment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment_id: commentId, content: newContent.trim() })
      });

      const result = await res.json();
      if (res.ok) {
        await loadComments();
      } else {
        alert(result.error || "수정 실패");
      }
    });
  });
  // 댓글 삭제 이벤트
  document.querySelectorAll(".delete_btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const li = e.target.closest("li");
      const commentId = li.getAttribute("data-id");
      if (!confirm("정말 삭제하시겠습니까?")) return;

      const res = await fetch("/post/delete_comment", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment_id: commentId })
      });

      const result = await res.json();
      if (res.ok) {
        await loadComments();
      } else {
        alert(result.error || "삭제 실패");
      }
    });
  });
}

  // 좋아요 버튼
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

  // 신고 버튼
  document.getElementById("report_btn").addEventListener("click", () => {
    const reason = prompt("신고 사유를 입력하세요:");
    if (reason) alert("신고가 접수되었습니다.");
  });

  // 답변 토글
  document.querySelectorAll('.answer_btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const container = document.querySelector('.submit_container');
      if (!container) return;

      if (getComputedStyle(container).display === 'none') {
        container.style.display = 'block';
        container.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        container.style.display = 'none';
      }
    });
  });
});
