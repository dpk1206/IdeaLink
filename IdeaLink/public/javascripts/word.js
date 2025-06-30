async function loadWordCloud() {
    try {
        // 1. API에서 데이터 받아오기
        const response = await fetch('http://127.0.0.1:5000/keywords');
        if (!response.ok) throw new Error("키워드 API 로드 오류");

        // 2. JSON 파싱
        const data = await response.json();
        console.log("✅ API 데이터:", data);

        // 3. [{word, score}] → [[word, score]] 변환
        const wordList = data.map(item => [item.word, item.score]);

        const wordcloudElement = document.getElementById('wordcloud');
        wordcloudElement.innerHTML = "";

        const width = window.innerWidth;
        const fontSize = width > 768 ? 20 : 14;
        
        const palette = [
            '#f8f1ff', // 연보라
            '#B3E1B9', // 연녹색
            '#e0f7e9', // 연민트
            '#fff9d6', // 연노랑
            '#f6dcff', // 연라벤더
            '#fce4ec', // 연핑크
            '#bd89fdde', // 연보라
            '#ffe0b2', // 연오렌지
            '#ffccbc', // 연살구
            '#0984e3', // 진한파랑
            '#48ffef', // 진한민트
            '#ffb7b2', // 살짝 진한 연핑크
            '#fbab9ae8', // 살짝 진한 주황
            '#ffcc80', // 살짝 진한 연노랑
            '#ffb7ffdb', // 살짝 연한 핫핑크
        ];
        WordCloud(wordcloudElement, {
            list: wordList,
            gridSize: Math.max(12, Math.floor(width / 50)),
            weightFactor: function (size) {
                const base = Math.pow(Math.log(size + 1), 1.1);
                return base * fontSize + Math.random() * 1;
            },
            fontFamily: 'Noto Sans KR, Arial, sans-serif',
            color: () => palette[Math.floor(Math.random() * palette.length)],
            rotateRatio: 0.25,
            rotationSteps: 2,
            minSize: 14,
            maxSize: 90,
            backgroundColor: 'transparent',
            drawOutOfBound: false,
            shuffle: true,
            shape: 'circle',
            clearCanvas: true,
            click: function (item) {
                location.href = `http://localhost:3000/post/ideas?keyword=${encodeURIComponent(item[0])}&search_type=title&page=1`;
            }
        });

        // 워드클라우드가 그려진 후 show 클래스 추가
        setTimeout(() => {
            wordcloudElement.classList.add('show');
        }, 100); // 약간의 딜레이(필요시 조정)

        console.log("✅ 워드클라우드 생성 성공");
    } catch (error) {
        console.error("❌ 워드클라우드 로드 오류:", error);
    }
}

document.addEventListener("DOMContentLoaded", loadWordCloud);
window.addEventListener("resize", loadWordCloud);
