
// 탭 전환
function showSection(id) {
  document.querySelectorAll('.admin-section').forEach(sec => {
    sec.style.display = (sec.id === id) ? 'block' : 'none';
  });
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

// 공지사항 작성/목록
function addNotice() {
  const title = document.getElementById("noticeTitle").value.trim();
  const content = document.getElementById("noticeContent").value.trim();
  if (!title || !content) {
    alert("제목과 내용을 입력하세요.");
    return;
  }
  const now = new Date().toISOString().split("T")[0];
  const notices = JSON.parse(localStorage.getItem("notices") || "[]");
  notices.unshift({ title, content, date: now });
  localStorage.setItem("notices", JSON.stringify(notices));
  renderNotices();
  addAdminLog(`공지사항 [${title}] 등록`);
  document.getElementById("noticeTitle").value = "";
  document.getElementById("noticeContent").value = "";
}

function renderNotices() {
  const notices = JSON.parse(localStorage.getItem("notices") || "[]");
  const list = document.getElementById("noticeList");
  list.innerHTML = "";
  notices.forEach(n => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${n.title}</td>
      <td>${n.date}</td>
      <td>
        <button onclick="editNotice(this)">수정</button>
        <button onclick="deleteNotice(this)">삭제</button>
      </td>
    `;
    list.appendChild(row);
  });
}

function editNotice(button) {
  const row = button.closest("tr");
  const titleCell = row.children[0];
  const newTitle = prompt("공지사항 제목 수정:", titleCell.textContent);
  if (newTitle) {
    titleCell.textContent = newTitle;
    addAdminLog(`공지사항 제목 수정 → ${newTitle}`);
  }
}

function deleteNotice(button) {
  const row = button.closest("tr");
  const title = row.children[0].textContent;
  if (confirm("삭제하시겠습니까?")) {
    row.remove();
    addAdminLog(`공지사항 삭제됨 → ${title}`);
  }
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
  renderNotices();
  showSection('suggestions'); // 기본 탭
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

window.onload = () => {
  renderNotices();
  showSection('suggestions');
  loadOnlineUsers(); // ✅ 추가됨
};