// 탭 전환
function showSection(id) {
  document.querySelectorAll('.admin-section').forEach(sec => {
    sec.style.display = (sec.id === id) ? 'block' : 'none';
  });

  // 대시보드 섹션이면 통계 로드
  if (id === 'dashboard') {
    loadAdminStats();
  }
}


// 필터링
function applySuggestionFilter() {
  const userId = document.getElementById("searchUser").value.trim();
  const date = document.getElementById("searchDate").value;
  const category = document.getElementById("filterCategory").value;
  const rows = document.querySelectorAll(".suggestion-row");

  rows.forEach(row => {
    const userMatch = row.dataset.userid.includes(userId);
    const dateMatch = !date || row.dataset.date === date;
    const categoryMatch = !category || row.dataset.category === category;
    row.style.display = (userMatch && dateMatch && categoryMatch) ? "" : "none";
  });
}
let currentReportId = null;

function openReplyModal(reportId) {
  currentReportId = Number(reportId);
  if (isNaN(currentReportId)) {
    alert("유효하지 않은 신고 ID입니다.");
    return;
  }

  document.getElementById('replyModal').style.display = 'block';
}

function closeReplyModal() {
  document.getElementById('replyModal').style.display = 'none';
  currentReportId = null;
}

document.getElementById('submitReply').addEventListener('click', async () => {
  const reply = document.getElementById('replyText').value.trim();
  if (!reply) return alert("답변을 입력하세요.");

  const res = await fetch(`/report/admin/reply/${currentReportId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reply })
  });

  const data = await res.json();
  if (data.success) {
    alert("답변이 등록되었습니다.");
    location.reload();
  } else {
    alert("오류: " + data.message);
  }
});

// 상태 변경 관련 전역 변수
let currentTargetId = null;
let currentTargetType = null;
let currentNewStatus = null;
let currentSelectElem = null;

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById('statusReasonModal');
  const textarea = document.getElementById('statusReasonInput');
  const cancelBtn = document.getElementById('cancelReasonBtn');
  const confirmBtn = document.getElementById('confirmReasonBtn');

  // 👉 select 초기값 저장 (모달에서 취소 눌렀을 때 복원용)
  document.querySelectorAll('select').forEach(sel => {
    sel.setAttribute('data-original', sel.value);
  });

  window.openStatusModal = function(targetId, newStatus, targetType, selectElem) {
    currentTargetId = targetId;
    currentNewStatus = newStatus;
    currentTargetType = targetType;
    currentSelectElem = selectElem;
    textarea.value = '';
    modal.style.display = 'flex';

    document.getElementById("selectedStatusText").textContent = `선택한 상태: ${newStatus}`;
  };

  cancelBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    if (currentSelectElem) {
      currentSelectElem.value = currentSelectElem.getAttribute('data-original') || currentSelectElem.value;
    }
  });

  confirmBtn.addEventListener('click', async () => {
    const reason = textarea.value.trim();
    if (!reason) {
      alert('사유를 입력해주세요.');
      return;
    }

    try {
      const res = await fetch('/admin/update_status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_id: currentTargetId,
          target_type: currentTargetType,
          status: currentNewStatus,
          reason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert('상태가 변경되었습니다.');
        location.reload();
      } else {
        alert('상태 변경에 실패했습니다: ' + (data.message || '서버 오류'));
        modal.style.display = 'none';
      }
    } catch (err) {
      alert('네트워크 오류가 발생했습니다.');
      modal.style.display = 'none';
    }
  });
});

function handleStatusChange(event, targetId, newStatus, targetType, selectElem) {
  // 모달 호출로 위임
  openStatusModal(targetId, newStatus, targetType, selectElem);
}



// 전체아이디어 / 게시글 필터링
 function filterPosts(filter) {
    const boxes = document.querySelectorAll(".post-box");
    const buttons = document.querySelectorAll(".filter-area button");

    boxes.forEach(box => {
      const type = box.dataset.type;
      const status = box.dataset.status;
      const match = filter === '전체' || type === filter || status === filter;
      box.style.display = match ? 'block' : 'none';
    });

    // ✅ 버튼 선택 상태 업데이트
    buttons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.textContent.includes(filter)) {
        btn.classList.add('active');
      }
    });
  }

function applyReportFilter() {
  const rows = document.querySelectorAll(".report-row");
  rows.forEach(row => {
    row.style.display = "block"; // 기본 전체 표시
  });
}

// 답변창 열기
function openAnswerForm(button) {
  const box = button.nextElementSibling;
  box.style.display = (box.style.display === "none") ? "block" : "none";
}

// 답변 저장
function submitAnswer(saveBtn) {
  const box = saveBtn.closest(".answer-box");
  const textarea = box.querySelector("textarea");
  const content = textarea.value.trim();
  if (!content) {
    alert("답변을 입력하세요.");
    return;
  }
  const row = saveBtn.closest("tr");
  const statusCell = row.querySelector(".status-cell");
  statusCell.textContent = "처리 완료";
  statusCell.classList.remove("status-wait");
  statusCell.classList.add("status-done");
  box.style.display = "none";
  addAdminLog("건의사항 답변 완료");
}

// 공지사항 등록
async function addNotice() {
  const title = document.getElementById("noticeTitle").value.trim();
  const content = document.getElementById("noticeContent").value.trim();
  if (!title || !content) {
    alert("제목과 내용을 입력하세요.");
    return;
  }

  try {
    const res = await fetch('/admin/notices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content })
    });

    const data = await res.json();
    if (data.success) {
      alert("공지사항이 등록되었습니다.");
      document.getElementById("noticeTitle").value = "";
      document.getElementById("noticeContent").value = "";
      loadNotices();  // DB에서 다시 불러와서 테이블 갱신
      addAdminLog(`공지사항 [${title}] 등록`);
    } else {
      alert("등록 실패: " + (data.message || "서버 오류"));
    }
  } catch (err) {
    console.error("공지 등록 오류", err);
    alert("서버 통신 오류");
  }
}


// 공지사항 목록 렌더링
async function loadNotices() {
  try {
    const res = await fetch('/admin/notices');
    const data = await res.json();
    const list = document.getElementById("noticeList");
    list.innerHTML = "";

    if (!data.success || !data.notices.length) {
      list.innerHTML = "<tr><td colspan='3'>공지사항이 없습니다.</td></tr>";
      return;
    }

    // 전역 저장 (id → notice 객체)
    window.noticeMap = {};
    data.notices.forEach(n => window.noticeMap[n.notice_id] = n);

    data.notices.forEach(n => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="notice-title" onclick="openNoticeModal(${n.notice_id})" style="cursor:pointer; color:#007bff;">
          ${n.title}
        </td>
        <td>${new Date(n.created_at).toISOString().split("T")[0]}</td>
        <td>
          <button onclick="editNotice(${n.notice_id})">수정</button>
          <button onclick="deleteNotice(${n.notice_id})">삭제</button>
        </td>
      `;
      list.appendChild(row);
    });
  } catch (err) {
    console.error("공지 목록 불러오기 오류", err);
  }
}


// 공지사항 수정
async function editNotice(id) {
  const n = window.noticeMap[id];
  if (!n) return;

  const newTitle = prompt("공지사항 제목 수정:", n.title);
  const newContent = prompt("공지사항 내용 수정:", n.content);

  if (newTitle && newContent) {
    const res = await fetch(`/admin/notices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, content: newContent })
    });

    const data = await res.json();
    if (data.success) {
      alert("수정 완료");
      loadNotices();
      addAdminLog(`공지사항 수정 → ${newTitle}`);
    } else {
      alert("수정 실패");
    }
  }
}


// 공지사항 삭제
async function deleteNotice(id) {
  const n = window.noticeMap[id];
  if (!n) return;

  if (!confirm("정말 삭제하시겠습니까?")) return;

  const res = await fetch(`/admin/notices/${id}`, {
    method: "DELETE"
  });

  const data = await res.json();
  if (data.success) {
    alert("삭제 완료");
    loadNotices();
    addAdminLog(`공지사항 삭제됨 → ${n.title}`);
  } else {
    alert("삭제 실패");
  }
}

// 공지사항 모달 열기
function openNoticeModal(id) {
  const n = window.noticeMap[id];
  if (!n) return;
  document.getElementById("modalNoticeTitle").textContent = n.title;
  document.getElementById("modalNoticeContent").textContent = n.content;
  document.getElementById("noticeModal").style.display = "flex";
}
document.addEventListener("DOMContentLoaded", () => {
  loadNotices();
});

function closeNoticeModal() {
  document.getElementById("noticeModal").style.display = "none";
}

function deleteReport(button) {
  const row = button.closest("tr");
  const user = row.dataset.userid;
  row.remove();
  addAdminLog(`신고 게시글 삭제됨 → ${user}`);
}

// 로그
function addAdminLog(action) {
  const logList = document.getElementById("logList");
  const now = new Date().toLocaleString();
  const adminId = "admin001";
  const row = document.createElement("tr");
  row.innerHTML = `<td>${now}</td><td>${adminId}</td><td>${action}</td>`;
  logList.prepend(row);
}

window.onload = () => {
  loadNotices();
  showSection('suggestions'); // 기본 탭
  showSection('posts');
};

function loadOnlineUsers() {
  const userList = document.getElementById("onlineUsers");
  const users = ["userA", "userB", "admin001"];  // 예시
  userList.innerHTML = "";
  users.forEach(u => {
    const li = document.createElement("li");
    li.textContent = u;
    userList.appendChild(li);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  applyPointLogFilter();
  loadAdminTotalPoint(); 
});

//  관리자 총 보유 포인트 불러오는 함수
async function loadAdminTotalPoint() {
  try {
    const res = await fetch('/admin/point-total');
    const data = await res.json();
    if (!data.success) {
      alert("관리자 포인트 조회 실패");
      return;
    }
    document.getElementById("adminTotalPoint").textContent = data.total.toLocaleString();
  } catch (err) {
    console.error(err);
    alert("관리자 포인트 불러오기 중 오류 발생");
  }
}

// 포인트 로그 필터링 및 출력
async function applyPointLogFilter() {
  const userInput = document.getElementById('searchPointUser').value.trim();
  const dateInput = document.getElementById('searchPointDate').value;
  const typeInput = document.getElementById('filterPointType').value;

  const res = await fetch('/admin/point-logs');
  const data = await res.json();

  if (!data.success) {
    alert('포인트 로그 조회 실패');
    return;
  }

  const logs = data.logs;
  const filtered = logs.filter(log => {
    const matchUser = !userInput || log.nick_name.includes(userInput);
    const matchDate = !dateInput || log.created_at.startsWith(dateInput);
    const matchType = !typeInput || log.type === typeInput;
    return matchUser && matchDate && matchType;
  });

  const tbody = document.getElementById('pointLogList');
  tbody.innerHTML = '';

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">검색 결과가 없습니다</td></tr>';
    return;
  }

  filtered.forEach(log => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${new Date(log.created_at).toLocaleString('ko-KR', { hour12: false })}</td>
      <td>${log.nick_name}</td>
      <td>${translatePointType(log.type)}</td>
      <td>${log.amount.toLocaleString()}P</td>
      <td>${log.description || '-'}</td>
    `;
    tbody.appendChild(tr);
  });
}

// 포인트 유형 한글 번역 함수
function translatePointType(type) {
  switch (type) {
    case 'charge': return '충전';
    case 'use': return '사용';
    case 'refund': return '환불';
    case 'answer_charge': return '답글 판매';
    case 'answer_use': return '답글 구매';
    case 'hold_use': return '에스크로 출금 (구매자)';
    case 'hold_charge': return '에스크로 입금 (관리자)';
    case 'hold_release': return '에스크로 출금 (관리자)';
    case 'hold_refund': return '에스크로 환불';
    case 'platform_fee': return '사이트 수수료';
    default: return type;
  }
}
function goToPostDetail(postId) {
  if (!postId) return;
  window.location.href = `/post/idea_detail?post_id=${postId}`;
}

// ✅ 월간 통계 불러오기
async function loadAdminStats() {
  const res = await fetch('/admin/stats');
  const data = await res.json();
  if (!data.success) return alert("통계 불러오기 실패");

  // 총 수익, 누적 거래
  document.getElementById('totalPlatformFee').textContent =
    `${data.totalFee?.toLocaleString?.() ?? 0} P`;
  document.getElementById('totalRequests').textContent =
    `${data.totalRequests?.toLocaleString?.() ?? 0}건`;
  document.getElementById('totalCompleted').textContent =
    `${data.totalCompleted?.toLocaleString?.() ?? 0}건`;

  // 월간 수익 테이블
  const feeBody = document.querySelector('#monthlyFeeTable tbody');
  feeBody.innerHTML = '';
  (data.monthlyFee ?? []).forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${row.month}</td><td>${row.income?.toLocaleString() ?? 0} P</td>`;
    feeBody.appendChild(tr);
  });

  // 월간 거래 테이블
  const tradeBody = document.querySelector('#monthlyTradeTable tbody');
  tradeBody.innerHTML = '';
  if (Array.isArray(data.monthlyTrade)) {
    data.monthlyTrade.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.month}</td>
        <td>${row.total ?? 0}건</td>
        <td>${row.done ?? 0}건</td>
      `;
      tradeBody.appendChild(tr);
    });
  } else {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="3">데이터 없음</td>`;
    tradeBody.appendChild(tr);
  }

  // ✅ Chart 생성 (중복 방지)
  const ctx = document.getElementById('tradeChart').getContext('2d');
  if (window.tradeChartInstance) {
    window.tradeChartInstance.destroy();
  }

  const allMonths = Array.from({ length: 12 }, (_, i) => `2025-${String(i + 1).padStart(2, '0')}`);
  const tradeData = data.monthlyTrade || [];

  const filledData = allMonths.map(month => {
    const found = tradeData.find(row => row.month === month);
    return {
      month,
      total: found?.total ?? 0,
      done: found?.done ?? 0
    };
  });

  const months = filledData.map(row => row.month);
  const requested = filledData.map(row => row.total);
  const completed = filledData.map(row => row.done);

  window.tradeChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        {
          label: '요청 건수',
          data: requested,
          backgroundColor: 'rgba(255, 193, 7, 0.6)',
          borderColor: 'rgba(255, 193, 7, 1)',
          borderWidth: 1,
          borderRadius: 8
        },
        {
          label: '거래 완료 건수',
          data: completed,
          backgroundColor: 'rgba(0, 123, 255, 0.6)',
          borderColor: 'blue',
          borderWidth: 1,
          borderRadius: 8
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true },
        tooltip: { enabled: true }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
            stepSize: 1
          }
        }
      }
    }
  });
}

// ✅ 카테고리별 거래 통계 함수 (함수 밖에 위치해야 함)
async function loadCategoryStats() {
  const res = await fetch('/admin/category_stats');
  const data = await res.json();
  console.log("카테고리 통계 응답:", data); // ✅ 이거 추가
  if (!data.success) return alert("카테고리 통계 조회 실패");

  const tbody = document.querySelector("#categoryStatsTable tbody");
  tbody.innerHTML = "";

  data.stats.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.main_name}</td>
      <td>${row.sub_name}</td>
      <td>${row.completed_count}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ✅ DOMContentLoaded 시 실행
document.addEventListener("DOMContentLoaded", () => {
  loadAdminStats();
  loadCategoryStats();
});
