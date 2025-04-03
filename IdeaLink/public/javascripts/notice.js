document.addEventListener('DOMContentLoaded', () => {
    const noticeList = document.querySelector('.notice-list');
  
    // 더미 공지 데이터 (실제 DB 연동 시 이 부분만 교체)
    const notices = [
      {
        title: '서비스 정기점검 안내',
        date: '2025-03-30',
        content: '보다 나은 서비스를 위해 정기 점검이 진행됩니다. 이용에 참고 부탁드립니다.'
      },
      {
        title: '아이디어 등록 가이드 개편',
        date: '2025-03-25',
        content: '아이디어 등록 절차가 간소화되어 더욱 편리해졌습니다!'
      },
      {
        title: '베타 오픈을 축하합니다 🎉',
        date: '2025-03-01',
        content: 'IdeaLink가 정식 오픈했습니다. 많은 관심과 이용 부탁드립니다!'
      }
    ];
  
    // 리스트에 공지 항목 추가
    notices.forEach(notice => {
      const li = document.createElement('li');
  
      li.innerHTML = `
        <div class="notice-title">${notice.title}</div>
        <div class="notice-date">${notice.date}</div>
      `;
  
      li.addEventListener('click', () => {
        alert(`📢 ${notice.title}\n\n${notice.content}`);
      });
  
      noticeList.appendChild(li);
    });
  });
  