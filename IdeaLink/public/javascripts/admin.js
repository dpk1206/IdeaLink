document.addEventListener('DOMContentLoaded', () => {
    // 1. 신고 게시글 삭제/무시 처리
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const row = btn.closest('tr');
        if (confirm('정말 이 게시글을 삭제하시겠습니까?')) {
          row.remove();
          alert('삭제되었습니다.');
        }
      });
    });
  
    document.querySelectorAll('.ignore-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const row = btn.closest('tr');
        row.remove();
        alert('신고를 무시했습니다.');
      });
    });
  
    // 2. 공지사항 등록 처리
    const noticeForm = document.getElementById('noticeForm');
    noticeForm?.addEventListener('submit', function (e) {
      e.preventDefault();
      const title = document.getElementById('noticeTitle').value.trim();
      const content = document.getElementById('noticeContent').value.trim();
  
      if (!title || !content) {
        alert('제목과 내용을 입력해주세요.');
        return;
      }
  
      alert(`공지 등록 완료!\n\n제목: ${title}\n내용: ${content}`);
      noticeForm.reset();
    });
  
    // 3. 건의사항 데이터 및 출력
    const suggestions = [
      {
        content: '아이디어 검색 기능에 필터 추가해 주세요.',
        date: '2025-03-31',
        reply: ''
      },
      {
        content: '모바일에서 글 쓰기가 너무 어려워요.',
        date: '2025-03-30',
        reply: ''
      },
      {
        content: '특허 관련 정보 팁이나 가이드를 보여주면 좋겠어요.',
        date: '2025-03-28',
        reply: ''
      }
    ];
  
    const suggestionList = document.getElementById('suggestionList');
    if (suggestionList) {
      suggestions.forEach((sug, idx) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${idx + 1}</td>
          <td>${sug.content}</td>
          <td>${sug.date}</td>
          <td><button class="reply-btn" data-index="${idx}">답변</button></td>
        `;
        suggestionList.appendChild(row);
      });
    }
  
    // 4. 답변 버튼 클릭 시 처리
    document.addEventListener('click', function (e) {
      if (e.target.classList.contains('reply-btn')) {
        const idx = e.target.dataset.index;
        const reply = prompt('답변 내용을 입력하세요:');
        if (reply) {
          suggestions[idx].reply = reply;
          alert('답변이 등록되었습니다.');
  
          // 버튼 상태 업데이트
          e.target.textContent = '완료됨';
          e.target.disabled = true;
          e.target.style.backgroundColor = '#ccc';
        }
      }
    });
  });
  