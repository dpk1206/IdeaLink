document.addEventListener("DOMContentLoaded", function () {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const sections = document.querySelectorAll(".mypage-section");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-tab");
      tabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      sections.forEach((sec) => {
        sec.style.display = sec.id === targetId ? "block" : "none";
      });
    });
  });

  // 사용자 유형에 따라 폼 보이기
  const isCompany = false; // true면 기업회원
  const personalForm = document.getElementById("personalForm");
  const companyForm = document.getElementById("companyForm");
  if (isCompany) {
    companyForm.style.display = "block";
  } else {
    personalForm.style.display = "block";
  }

  // 유저 이름 중복 확인
  const checkBtn = document.getElementById("checkUsername");
  if (checkBtn) {
    checkBtn.addEventListener("click", () => {
      alert("사용 가능한 유저이름입니다.");
    });
  }

  // ===== 💬 채팅 기능 =====


    // ===== 등록아이디어 탭 =====
  document.querySelectorAll(".mypost-tab-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".mypost-tab-btn").forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      document.querySelectorAll("#ideas .mypage-table").forEach((tab) => {
        tab.style.display = "none";
      });

      const target = this.getAttribute("data-tab");
      document.getElementById("post-type").innerText =
        target === "ideas-table" ? "아이디어" :
          target === "answer-table" ? "답글" : "댓글";

      document.getElementById(target).style.display = "table";
    });
  });

  // ===== 💳 포인트 충전 기능 =====
  const tossPayments = TossPayments("test_ck_Z1aOwX7K8mOBXbPzKEKqVyQxzvNP");
  const payForm = document.getElementById("payForm");
  if (payForm) {
    payForm.onsubmit = function (e) {
      e.preventDefault();
      const title = document.getElementById("title").value;
      const sellerId = document.getElementById("sellerId").value;
      const amount = Number(document.getElementById("amount").value);
      const orderId = `order_${Date.now()}`;
      tossPayments.requestPayment("카드", {
        amount: amount,
        orderId: orderId,
        orderName: title,
        customerName: sellerId,
        successUrl: `http://localhost:3000/payment/success?sellerId=${sellerId}`,
        failUrl: "http://localhost:3000/payment/fail"
      });
    };
  }
});

// ===== 북마크 삭제 비동기 처리 =====
async function toggleDeleteBookmark(event, userId, postId) {
  event.stopPropagation();
  try {
    const response = await fetch('/users/bookmark', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, post_id: postId })
    });
    const tr = event.currentTarget.closest("tr");
    tr.remove();
  } catch (error) {
    alert('에러 발생: ' + error);
  }
}

// 채팅 창
function chatWindow(user_id, writer_id, post_id, type) {
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

// ===== 🔔 알림 기능 =====
// 알림 읽음 처리
async function markAsRead(btn, notification_id, type) {
  try {
    const response = await fetch('/users/notification/read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notification_id: notification_id, type: type })
    });

    if (response.ok) {
      alert('읽음 처리되었습니다.');

      // 버튼이 속한 li 요소 찾기
      const liElement = btn.closest('li');

      // 해당 li 내부의 .chat-unread 요소 찾기
      const chatUnreadEl = liElement.querySelector('.chat-unread');
      const currentText = chatUnreadEl.textContent;
      // "• 2" 형태에서 숫자만 추출
      const match = currentText.match(/\d+/);
      const num = parseInt(match[0], 10);
      // 해당 누적 알림 개수 제거
      chatUnreadEl.textContent = '';
      document.querySelectorAll('.notification').forEach(el => {
        // "• 2" 형태에서 숫자만 추출
        const match = el.textContent.match(/\d+/);
        if (match) {
          const notiNum = parseInt(match[0], 10);
          if (notiNum - num <= 0) {
            el.textContent = ''; // 0 이하이면 빈 문자열
          } else {
            el.textContent = `• ${notiNum - num}`; // 1 이상이면 "• 숫자"로 표시
          }
        }
      });

      // 4. 버튼 비활성화
      btn.disabled = true;
    } else {
      alert('읽음 처리에 실패했습니다.');
    }
  } catch (err) {
    console.error('에러:', err);
    alert('서버 오류가 발생했습니다.');
  }
}
