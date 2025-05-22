document.addEventListener("DOMContentLoaded", () => {
  const post_id = new URLSearchParams(window.location.search).get("post_id");
  const likeBtn = document.getElementById("like_btn");
  const likeCount = document.getElementById("like_count");
  const commentInput = document.getElementById("comment_input");
  const commentSubmit = document.getElementById("comment_submit");
  const commentList = document.getElementById("comment_list");

  // 댓글 불러오기
  async function loadComments() {
    const res = await fetch(`/post/get_comments?post_id=${post_id}`);
    if (!res.ok) return alert("댓글 불러오기 실패");

    const comments = await res.json();
    commentList.innerHTML = "";

    comments.forEach(c => {
      const li = document.createElement("li");
      li.setAttribute("data-id", c.comment_id);

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
      li.innerHTML = html;
      commentList.appendChild(li);
    });

    bindEditDeleteEvents();
  }

  // 댓글 작성
  commentSubmit.addEventListener("click", async () => {
    const content = commentInput.value.trim();
    if (!content) return alert("댓글을 입력하세요.");

    try {
      const res = await fetch("/post/add_comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id, content })
      });

      const result = await res.json();
      if (res.ok) {
        commentInput.value = "";
        await loadComments();
      } else {
        alert(result.error || "댓글 등록 실패");
      }
    } catch (err) {
      console.error("댓글 등록 오류:", err);
      alert("댓글 등록 중 오류 발생");
    }
  });

  // 댓글 수정/삭제 이벤트 바인딩
  function bindEditDeleteEvents() {
    document.querySelectorAll(".edit_btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const li = e.target.closest("li");
        const commentId = li.getAttribute("data-id");
        const contentEl = li.querySelector(".text");
        const oldContent = contentEl.textContent;
        const newContent = prompt("수정할 내용을 입력하세요", oldContent);
        if (!newContent || newContent.trim() === "") return;

        const res = await fetch("/post/edit_comment", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comment_id: commentId, content: newContent.trim() })
        });

        const result = await res.json();
        if (res.ok) await loadComments();
        else alert(result.error || "수정 실패");
      });
    });

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
        if (res.ok) await loadComments();
        else alert(result.error || "삭제 실패");
      });
    });
  }

  // 좋아요 상태 확인
  (async () => {
    try {
      const res = await fetch(`/post/like_status?post_id=${post_id}`);
      if (res.ok) {
        const data = await res.json();
        likeCount.textContent = data.like_count;

        if (data.liked) {
          likeBtn.classList.add("liked");
          likeBtn.disabled = true;
          likeBtn.textContent = `👍 좋아요 (${data.like_count})`;
        }
      }
    } catch (err) {
      console.error("좋아요 상태 확인 실패:", err);
    }
  })();

  // 좋아요 클릭 이벤트
  likeBtn.addEventListener("click", async () => {
    if (!currentUserId) {
      alert("로그인 후 추천할 수 있습니다.");
      return;
    }

    const confirmed = confirm("좋아요는 한 번만 누를 수 있습니다.\n진행하시겠습니까?");
    if (!confirmed) return;

    try {
      const res = await fetch("/post/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id })
      });

      const result = await res.json();

      if (res.ok) {
        likeCount.textContent = result.like_count;
        likeBtn.classList.add("liked");
        likeBtn.disabled = true;
        likeBtn.textContent = `👍 좋아요 (${result.like_count})`;
        alert("추천이 완료되었습니다.");
      } else {
        alert(result.error || "이미 추천하셨습니다.");
      }
    } catch (err) {
      console.error("추천 오류:", err);
      alert("추천 처리 중 오류가 발생했습니다.");
    }
  });

  // 신고 버튼
  document.getElementById("report_btn").addEventListener("click", () => {
    const reason = prompt("신고 사유를 입력하세요:");
    if (reason) alert("신고가 접수되었습니다.");
  });

  // 답변 작성 토글
  document.querySelectorAll(".answer_btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const container = document.querySelector(".submit_container");
      if (!container) return;

      if (getComputedStyle(container).display === 'none') {
        container.style.display = 'block';
        container.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        container.style.display = 'none';
      }
    });
  });

  // 댓글 최초 로드
  loadComments();
});
