document.addEventListener('DOMContentLoaded', function () {
  const track = document.getElementById('categoryTrack');
  const left = document.getElementById('category-left');
  const right = document.getElementById('category-right');
  const form = document.querySelector('form');

  // 좌우 스크롤
  left?.addEventListener('click', () => {
    track.scrollBy({ left: -200, behavior: 'smooth' });
  });
  right?.addEventListener('click', () => {
    track.scrollBy({ left: 200, behavior: 'smooth' });
  });

  // 카테고리 단일 선택
  const categoryCheckboxes = document.querySelectorAll('input[name="category"]');
  categoryCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        categoryCheckboxes.forEach(cb => {
          if (cb !== checkbox) cb.checked = false;
        });
      }
    });
  });

  // 파일 선택/삭제 처리
  const fileInput = document.getElementById('fileInput');
  const fileList = document.getElementById('fileList');
  let selectedFiles = [];

  fileInput.addEventListener('change', (e) => {
    const newFiles = Array.from(e.target.files);

    newFiles.forEach(file => {
      // 파일 이름 + 크기로 중복 체크
      if (!selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
        selectedFiles.push(file);

        const li = document.createElement('li');
        li.className = 'file-item';
        li.innerHTML = `
          ${file.name}
          <span class="remove-file" data-name="${file.name}" data-size="${file.size}">❌</span>
        `;

        fileList.appendChild(li);
      }
    });

    fileInput.value = ''; // input 초기화 (같은 파일 다시 선택 가능하게)
  });

  // 파일 제거 처리
  fileList.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-file')) {
      const { name, size } = e.target.dataset;
      selectedFiles = selectedFiles.filter(file => !(file.name === name && file.size === Number(size)));
      e.target.parentElement.remove();
    }
  });

  // 제출 처리
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const title = form.querySelector('input[name="title"]').value.trim();
    const description = form.querySelector('textarea[name="description"]').value.trim();
    const category = Array.from(categoryCheckboxes).find(cb => cb.checked);
    const dealType = form.querySelector('input[name="dealType"]:checked');
    const price = form.querySelector('input[name="price"]').value.trim();

    if (!title || !description || !category || !dealType || !price) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }

    const formData = new FormData();

    // 텍스트 입력 필드 추가
    const fields = form.querySelectorAll('input, textarea, select');
    fields.forEach(field => {
      if ((field.type === 'checkbox' || field.type === 'radio') && !field.checked) return;
      if (field.name && field.value !== '') {
        formData.append(field.name, field.value);
      }
    });

    // 파일 실제 첨부
    selectedFiles.forEach(file => {
      formData.append('attachments[]', file);
    });

    // 예시: 서버 전송
    /*
    fetch('/submit', {
      method: 'POST',
      body: formData
    }).then(res => {
      if (res.ok) {
        window.location.href = 'ideas.html';
      } else {
        alert('등록 실패');
      }
    });
    */

    // 테스트용
    alert('아이디어가 성공적으로 등록되었습니다!');
    form.reset();
    fileList.innerHTML = '';
    selectedFiles = [];
    window.location.href = 'ideas.html';
  });
});
