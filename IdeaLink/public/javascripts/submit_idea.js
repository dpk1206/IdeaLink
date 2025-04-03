document.addEventListener('DOMContentLoaded', function () {
  const track = document.getElementById('categoryTrack');
  const left = document.getElementById('category-left');
  const right = document.getElementById('category-right');

  left.addEventListener('click', () => {
    track.scrollBy({ left: -200, behavior: 'smooth' });
  });

  right.addEventListener('click', () => {
    track.scrollBy({ left: 200, behavior: 'smooth' });
  });

  // 카테고리 단일 선택 처리
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

  // 기본 form 동작 막고 유효성 검사 후 alert
  const form = document.querySelector('form');
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const title = form.querySelector('input[name="title"]').value.trim();
    const description = form.querySelector('textarea[name="description"]').value.trim();
    const category = Array.from(categoryCheckboxes).find(cb => cb.checked);
    const dealType = form.querySelector('input[name="dealType"]:checked');
    const price = form.querySelector('input[name="price"]').value.trim();
    const saleType = form.querySelector('select[name="sale_type"]').value;

    if (!title || !description || !category || !dealType || !price || !saleType) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }

    alert('아이디어가 성공적으로 등록되었습니다!');
    form.reset();
  });
});
