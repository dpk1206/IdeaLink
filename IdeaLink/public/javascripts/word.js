// word.js

async function loadWordCloud() {
    try {
        const response = await fetch('http://127.0.0.1:5500/keywords.json');
        if (!response.ok) throw new Error("JSON 파일 로드 오류");

        const data = await response.json();
        console.log("✅ JSON 파일 데이터:", data);

        const wordcloudElement = document.getElementById('wordcloud');
        wordcloudElement.innerHTML = ""; // ✅ 기존 워드클라우드 초기화

        // ✅ 반응형 크기 계산
        const width = window.innerWidth;
        const fontSize = width > 768 ? 15 : 10; // 반응형 글자 크기 (데스크탑 / 모바일)

        // ✅ 워드클라우드 직접 생성
        WordCloud(wordcloudElement, {
            list: data,                    // 모든 키워드 포함
            gridSize: Math.max(8, Math.floor(width / 80)), // 반응형 그리드 크기
            weightFactor: function (size) {
                return Math.log(size + 1) * fontSize; // 글자 크기 동적 조정
            },
            fontFamily: 'Noto Sans KR, Arial, sans-serif',
            color: function() {
                return (Math.random() > 0.5) ? '#ffffff' : '#dfe6e9';
            },
            rotateRatio: 0,                // 오직 가로/세로 (대각선 없음)
            minSize: 12,                   // 최소 글자 크기 (모바일에서도 최소 12px)
            maxSize: 80,                   // 최대 글자 크기
            backgroundColor: 'transparent',
            drawOutOfBound: true,          // 글자가 잘리더라도 강제 표시
            shuffle: false,                // 순서대로 정렬
            shape: 'square',               // 네모 모양으로 깔끔하게 정렬
            clearCanvas: true,             // 초기화
            click: function(item) {
                console.log("✅ 클릭된 키워드:", item[0]);
                alert(`클릭한 키워드: ${item[0]}`);
            }
        });

        console.log("✅ 워드클라우드 생성 성공");
    } catch (error) {
        console.error("❌ 워드클라우드 로드 오류:", error);
    }
}

// 페이지 로드 시 워드클라우드 로드
document.addEventListener("DOMContentLoaded", loadWordCloud);

// ✅ 반응형 지원 - 화면 크기 변경 시 워드클라우드 다시 로드
window.addEventListener("resize", loadWordCloud);
