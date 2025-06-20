document.addEventListener("DOMContentLoaded", async () => {
  const list = document.querySelector(".notice-list");

  try {
    const res = await fetch('/api/notice');  // 기존 '/notice' → '/api/notice' 로 변경
    const data = await res.json();

    if (!data.success || !data.notices.length) {
      list.innerHTML = "<li>공지사항이 없습니다.</li>";
      return;
    }

    data.notices.forEach(n => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong style="font-size: 18px;">${n.title}</strong>
        <p style="font-size: 14px; color: gray;">${new Date(n.created_at).toISOString().split('T')[0]}</p>
        <div style="margin-top: 10px;">${n.content}</div>
        <hr />
      `;
      list.appendChild(li);
    });
  } catch (err) {
    console.error("공지사항 불러오기 실패", err);
    list.innerHTML = "<li>공지사항을 불러올 수 없습니다.</li>";
  }
});
