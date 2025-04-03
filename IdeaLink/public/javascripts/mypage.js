document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.mypage-content');
  
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
  
        contents.forEach(content => content.style.display = 'none');
        const target = btn.getAttribute('data-tab');
        document.getElementById(target).style.display = 'block';
  
        if (target === 'profile') showUserTypeForm();
      });
    });
  
    function getUserType() {
      return localStorage.getItem('userType') || 'personal';
    }
  
    function showUserTypeForm() {
      const type = getUserType();
      const personalForm = document.getElementById('personalForm');
      const companyForm = document.getElementById('companyForm');
  
      if (type === 'company') {
        personalForm.style.display = 'none';
        companyForm.style.display = 'block';
      } else {
        personalForm.style.display = 'block';
        companyForm.style.display = 'none';
      }
    }
  
    document.getElementById('profile').style.display = 'block';
    showUserTypeForm();
  
    // 유저이름 중복 확인
    document.getElementById('checkUsername')?.addEventListener('click', () => {
      const username = document.getElementById('username').value.trim();
      if (!username) {
        alert('유저이름을 입력해주세요.');
        return;
      }
      alert(`'${username}' 유저이름은 사용 가능합니다!`);
    });
  });
  