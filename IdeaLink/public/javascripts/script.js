// 섹션으로 스크롤 이동
function scrollToSection(id) {
    document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
  }
  
  // 휠로 섹션 넘기기
  let isScrolling = false;
  const sections = document.querySelectorAll('.section');
  let currentIndex = 0;
  
  window.addEventListener('wheel', (e) => {
    if (isScrolling) return;
    isScrolling = true;
  
    if (e.deltaY > 0 && currentIndex < sections.length - 1) {
      currentIndex++;
    } else if (e.deltaY < 0 && currentIndex > 0) {
      currentIndex--;
    }
  
    sections[currentIndex].scrollIntoView({ behavior: 'smooth' });
  
    setTimeout(() => isScrolling = false, 800);
  });
  
  // 등장 애니메이션
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
      }
    });
  }, { threshold: 0.3 });
  
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
  
  // 햄버거 메뉴 토글
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('nav-menu');
  
  hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('open');
  });
  
  // 카테고리 캐러셀 좌우 이동
  function scrollCategories(direction) {
    const track = document.getElementById('categoryTrack');
    const scrollAmount = 300; // 한 번에 이동할 픽셀
    track.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
  }
  