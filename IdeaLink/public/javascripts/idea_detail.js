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
        container.style.display = "none";
      }
    });
  });

  // 댓글 최초 로드
  loadComments();
});

// 북마크 등록, 해제
function toggleBookmark(user_id, post_id) {
  const btn = document.getElementById("bookmarkBtn");
  const star = btn.querySelector(".star");
  if (btn.classList.contains("active")) {
    btn.classList.remove("active");
    star.textContent = "☆";
    // 서버에 북마크 해제 비동기 요청
    fetch("/users/bookmark", {
      method: "DELETE",
      body: JSON.stringify({post_id}),
      headers: { "Content-Type": "application/json" },
    });
  } else {
    btn.classList.add("active");
    star.textContent = "★";
    // 서버에 북마크 등록 비동기 요청
    fetch("/users/bookmark", {
      method: "POST",
      body: JSON.stringify({post_id}),
      headers: { "Content-Type": "application/json" },
    });
  }
}

// 채팅 창
function chatBtn(user_id, writer_id, post_id, type) {
  // 1. 폼 요소 생성
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = '/chat';
  form.target = 'chatWindow'; // 새 창 이름

  // 2. 필요한 데이터 input 요소로 추가
  const params = {
    sender_id: user_id,
    receiver_id: writer_id,
    post_id: post_id,
    type: type
  };

  for (const key in params) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = params[key];
    form.appendChild(input);
  }

  // 3. 폼을 body에 추가
  document.body.appendChild(form);

  // 4. 새 창을 먼저 연 뒤 폼 제출
  window.open('', 'chatWindow', 'width=600,height=800,resizable=yes,scrollbars=yes');
  form.submit();

  // 5. 폼 제거(클린업)
  document.body.removeChild(form);
}

document.addEventListener("DOMContentLoaded", () => {
  const buyBtn = document.getElementById("buyBtn");
  const promiseModal = document.getElementById("promiseModal");
  const confirmPromise = document.getElementById("confirmPromise");
  const promiseCheck = document.getElementById("promiseCheck");
  const paymentModal = document.getElementById("paymentModal");
  const confirmPurchase = document.getElementById("confirmPurchase");

  // ✅ post_id 추출
  const urlParams = new URLSearchParams(window.location.search);
  const post_id = urlParams.get("post_id");

  // ✅ 공통 구매 진행 함수
  const handlePurchase = (postId, answerId = null, defaultPrice = null) => {
    promiseModal.style.display = "flex";

    confirmPromise.replaceWith(confirmPromise.cloneNode(true));
    const newConfirmPromise = document.getElementById("confirmPromise");

    newConfirmPromise.onclick = () => {
      if (!promiseCheck.checked) {
        alert("서약에 동의해야 진행 가능합니다.");
        return;
      }

      promiseModal.style.display = "none";
      paymentModal.style.display = "flex";

      // 가격 입력창 초기화 (본문 구매 시에도 가격 입력 가능)
      if (defaultPrice !== null) {
        const input = document.getElementById("input_price");
        if (input) input.value = defaultPrice;
      }

      confirmPurchase.replaceWith(confirmPurchase.cloneNode(true));
      const newConfirmPurchase = document.getElementById("confirmPurchase");

      newConfirmPurchase.onclick = async () => {
        try {
          const inputPrice = document.getElementById("input_price")?.value;
          const price = inputPrice ? parseInt(inputPrice) : null;

          const body = answerId
            ? { post_id: postId, answer_id: answerId, price }
            : { post_id: postId, price };

          const url = answerId
            ? "/post/request_answer_purchase"
            : `/post/reserve/${postId}`;

          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          });

          const result = await res.json();
          console.log("✅ 서버 응답 결과:", result);

          if (res.ok && result.success) {
            alert("⏳ 거래 요청이 접수되었습니다.");
            paymentModal.style.display = "none";
            location.reload();
          } else {
            alert(result.message || "❌ 거래 요청 실패");
          }
        } catch (err) {
          console.error("❌ 거래 요청 중 오류:", err);
          alert("❌ 거래 요청 처리 중 오류 발생");
        }
      };
    };
  };

  // 📌 본문용 구매 버튼
  if (buyBtn) {
    buyBtn.addEventListener("click", () => {
      const defaultPrice = document.getElementById("modal_price")?.dataset.price;
      handlePurchase(post_id, null, defaultPrice ? parseInt(defaultPrice) : null);
    });
  }
  
  // 📌 답글용 구매 버튼들
document.querySelectorAll('.buy_answer_btn').forEach(btn => {
  btn.addEventListener('click', async (e) => {
    e.preventDefault();

    const answerId = btn.getAttribute('data-answer-id');
    const postId = btn.getAttribute('data-post-id');
    const price = btn.getAttribute("data-price");
    const sellerName = btn.getAttribute('data-seller-name');
    const answerTitle = btn.closest('.detail_card').querySelector('#answer_title').innerText.trim();

    // 모달 채우기 (미리 세팅)
    document.getElementById("modal_title").innerText = answerTitle;
    document.getElementById("modal_seller").innerText = sellerName;
    const priceElem = document.getElementById("modal_price");
    priceElem.innerText = `${Number(price).toLocaleString()}P`;
    priceElem.dataset.price = price;

    // 입력창 초기화
    const input = document.getElementById("input_price");
    if (input) input.value = price;

    // ✅ 서약 모달 먼저 보여주기
    promiseModal.style.display = "flex";

    // 기존 confirmPromise 버튼 이벤트 제거 후 재등록
    confirmPromise.replaceWith(confirmPromise.cloneNode(true));
    const newConfirmPromise = document.getElementById("confirmPromise");

    newConfirmPromise.onclick = () => {
      if (!promiseCheck.checked) {
        alert("서약에 동의해야 진행 가능합니다.");
        return;
      }

      // 서약 완료 → 서약 모달 닫고 결제 모달 열기
      promiseModal.style.display = "none";
      paymentModal.style.display = "flex";

      // 구매 확정 버튼 이벤트 재등록
      confirmPurchase.replaceWith(confirmPurchase.cloneNode(true));
      const newConfirmPurchase = document.getElementById("confirmPurchase");

      newConfirmPurchase.onclick = async () => {
        try {
          const inputPrice = document.getElementById("input_price")?.value;
          const finalPrice = inputPrice ? parseInt(inputPrice) : parseInt(price);

          const res = await fetch("/post/request_answer_purchase", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ post_id: postId, answer_id: answerId, price: finalPrice }),
          });

          const result = await res.json();

          if (res.ok && result.success) {
            alert("⏳ 거래 요청이 접수되었습니다.");
            paymentModal.style.display = "none";
            location.reload();
          } else {
            alert(result.message || "❌ 거래 요청 실패");
          }
        } catch (err) {
          console.error("❌ 거래 요청 중 오류:", err);
          alert("❌ 거래 요청 처리 중 오류 발생");
        }
      };
    };
  });
});
}); 
