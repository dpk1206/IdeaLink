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

  // ===== 🔔 알림 기능 =====
  const dummyAlerts = [
    "스마트 화분 시스템에 새 메시지가 도착했습니다.",
    "관리자가 건의사항에 답변을 등록했습니다.",
  ];

  const alertList = document.getElementById("alertList");
  dummyAlerts.forEach((alert) => {
    const li = document.createElement("li");
    li.textContent = alert;
    alertList.appendChild(li);
  });

  // ===== 💬 채팅 기능 =====
  const dummyChats = [
    {
      room_id: "room1",
      title: "스마트 화분 구매자",
      messages: [
        { from: "상대", text: "안녕하세요~ 관심있어요!", read: false },
        {
          from: "나",
          text: "감사합니다. 어떤 점이 궁금하신가요?",
          status: "read",
        },
      ],
    },
    {
      room_id: "room2",
      title: "AI 주방 도우미 제안",
      messages: [{ from: "상대", text: "제안 감사합니다.", read: false }],
    },
  ];

  const chatRoomList = document.getElementById("chatRoomList");
  const chatRoomTitle = document.getElementById("chatRoomTitle");
  const chatMessages = document.getElementById("chatMessages");
  const chatInput = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");

  let currentRoom = null;

  function updateNotifBadge() {
    const alertTab = document.querySelector('[data-tab="alerts"]');
    const hasUnread = dummyChats.some((chat) =>
      chat.messages.some((msg) => msg.from === "상대" && !msg.read)
    );
    alertTab.innerHTML = hasUnread ? "🔔 알림 ●" : "🔔 알림";
  }

  dummyChats.forEach((chat) => {
    const roomEl = document.createElement("div");
    roomEl.className = "chat-room";
    roomEl.innerHTML = `
      <div class="chat-title">${chat.title}</div>
      <div class="chat-preview">${chat.messages.slice(-1)[0].text}</div>
    `;
    roomEl.addEventListener("click", () => {
      currentRoom = chat;
      currentRoom.messages.forEach((msg) => {
        if (msg.from === "상대") msg.read = true;
      });
      updateNotifBadge();
      chatRoomTitle.textContent = chat.title;
      renderMessages(currentRoom.messages);
    });
    chatRoomList.appendChild(roomEl);
  });

  function renderMessages(messages) {
    chatMessages.innerHTML = "";
    messages.forEach((msg) => {
      const msgEl = document.createElement("div");
      msgEl.className = "message " + (msg.from === "나" ? "to" : "from");
      msgEl.textContent = msg.text;

      if (msg.from === "나" && msg.status) {
        const statusEl = document.createElement("span");
        statusEl.className = "message-status";
        statusEl.textContent = msg.status === "read" ? "✔️ 읽음" : "✔️ 전송됨";
        msgEl.appendChild(statusEl);
      }

      chatMessages.appendChild(msgEl);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  sendBtn.addEventListener("click", () => {
    const text = chatInput.value.trim();
    if (text && currentRoom) {
      currentRoom.messages.push({ from: "나", text, status: "sent" });
      renderMessages(currentRoom.messages);
      chatInput.value = "";
    }
  });

  updateNotifBadge();

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
