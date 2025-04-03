document.addEventListener('DOMContentLoaded', () => {
    // FAQ 펼치기 / 접기 기능
    const questions = document.querySelectorAll('.faq-question');
  
    questions.forEach(btn => {
      btn.addEventListener('click', () => {
        const isActive = btn.classList.contains('active');
  
        // 모두 닫기
        questions.forEach(q => {
          q.classList.remove('active');
          q.nextElementSibling.style.display = 'none';
        });
  
        // 클릭된 항목만 열기
        if (!isActive) {
          btn.classList.add('active');
          btn.nextElementSibling.style.display = 'block';
        }
      });
    });
  
    // 건의 제출 처리
    const form = document.getElementById('suggestForm');
    const textarea = document.getElementById('suggestText');
  
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = textarea.value.trim();
  
      if (!text) {
        alert('건의 내용을 입력해주세요.');
        return;
      }
  
      // 실제 저장은 추후 서버 연동 필요
      alert('건의가 성공적으로 제출되었습니다. 감사합니다!');
      form.reset();
    });
  });
  