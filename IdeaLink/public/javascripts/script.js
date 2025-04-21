
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
  const token = localStorage.getItem("token");
  
  // 로그인 상태 반영
  if (navMenu) {
    if (token) {
      try {
        const decoded = jwt_decode(token);
        console.log(decoded);
        const nickname = decoded.nick_name || decoded.email || "사용자";
        const user_id = decoded.user_id || null;

        navMenu.innerHTML = `
          <a href="#main">메인</a>
          <a href="#ideas">아이디어</a>
          <a href="#notice">공지사항</a>
          <a href="/users/mypage?user_id=${user_id}">${nickname}님</a>
          <a href="#" id="logoutBtn">로그아웃</a>
        `;

        document.getElementById("logoutBtn").addEventListener("click", () => {
          localStorage.removeItem("token"); //토큰 삭제
          alert("로그아웃 되었습니다.");
          location.href="/";
        });

      } catch (err) {
        console.error("JWT 디코딩 오류:", err);
        localStorage.removeItem("token");
      }
    } else {
      navMenu.innerHTML = `
        <a href="#main">메인</a>
        <a href="#ideas">아이디어</a>
        <a href="#notice">공지사항</a>
        <a href="/login_signup">로그인/회원가입</a>
      `;
    }
  }

  hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('open');
  });
  
  // 카테고리 캐러셀 좌우 이동
  function scrollCategories(direction) {
    const track = document.getElementById('categoryTrack');
    const scrollAmount = 300; // 한 번에 이동할 픽셀
    track.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
  }
  
  // 워드클라우드
// 테스트용 단어 리스트
    var words = [
      {
        text: "네이버",
        weight: 13,
        link: "https://naver.com",
        color: "green",
      },
      { text: "Ipsum", weight: 10 },
      { text: "노드JS", weight: 9 },
      { text: "Sit", weight: 8 },
      { text: "조금은긴단어", weight: 6 },
      { text: "조금더많이긴단어테스트", weight: 5 },
      { text: "Adipiscing", weight: 5 },
      { text: "반갑습니다", weight: 5 },
      { text: "internationalization", weight: 4 }, // 20자 정도면 잘려서 안 나올 때도 있음
      { text: "좋은하루", weight: 3 },
      { text: "Tempus", weight: 2 },
      { text: "Vestibulum", weight: 1 },
    ];
  
    // jqcloud 라이브러리의 설정
    var jqCloudSettings = {
      width: 800,
      height: 550,
      steps: 7,
      fontSize: {
        from: 0.1,
        to: 0.03,
      },
      autoResize: true,
      colors: [
        "#800026",
        "#bd0026",
        "#e31a1c",
        "#fc4e2a",
        "#fd8d3c",
        "#feb24c",
        "#fed976",
        "#ffeda0",
        "#ffffcc",
      ],
    };
    // 워드 클라우드 생성
    $("#wordcloud_div").jQCloud(words, jqCloudSettings);
