document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chatMessages');
    const unreadMark = document.querySelector('.unread-mark');
    requestAnimationFrame(() => {
        if (unreadMark) {
            chatBox.scrollTop = unreadMark.offsetTop - 50;
        } else {
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    });
});

// 채팅용 소켓 연결
const chatSocket = io('/chat', {
    auth: { user_id: user_id }
});
// 채팅방 입장
chatSocket.emit('joinRoom', chatting_room_id);

const chatBox = document.getElementById('chatMessages');
const form = document.getElementById('chat-form');
const input = document.getElementById('message-input');

// 안읽은 상대방 메시지 관찰 (Intersection Observer)
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const messageDiv = entry.target;
            const message_id = messageDiv.dataset.messageId;
            const statusElement = messageDiv.querySelector('.message-status');

            // data-is-read="0"이고 상대방 메시지인지 확인
            if (statusElement?.dataset.isRead === '0' && messageDiv.classList.contains('other')) {
                console.log("옵저버 발동", message_id);
                chatSocket.emit('markAsRead', message_id);
                observer.unobserve(messageDiv); // 관찰 중단
            }
        }
    });
}, { threshold: 0.9 }); // 90% 보일 때

// 모든 .other 메시지 중 data-is-read="0"인 것만 관찰
document.querySelectorAll('.message.other').forEach(msg => {
    const status = msg.querySelector('.message-status[data-is-read="0"]');
    if (status) {
        observer.observe(msg);
    }
});

// 채팅 메시지 수신
chatSocket.on('message', function (msg) {
    console.log("채팅 메시지 수신:", msg);
    if (msg.chatting_room_id != chatting_room_id) return;

    const div = document.createElement('div');
    div.className = 'message ';
    div.className += (msg.sender_id == user_id ? 'mine' : 'other');
    div.setAttribute('data-message-id', msg.message_id);

    // 읽음 상태 표시
    let statusHtml = '';
    if (msg.is_read == 1) {
        statusHtml = '<span class="message-status" data-is-read="1">✔️읽음</span>';
    } else {
        statusHtml = '<span class="message-status" data-is-read="0">🔵읽지 않음</span>';
    }

    // 파일 미리보기 HTML
    let fileHtml = '';
    if (msg.files && msg.files.length > 0) {
        msg.files.forEach(file => {
            const ext = getFileExtension(file.originalname);

            if (ext === 'pdf') {
                fileHtml += `
                <div class="file-box">
                    <div class="file-name">▶ ${file.originalname}</div>
                    <div class="file-size">용량: ${formatFileSize(file.size)}</div>
                    <div class="file-actions">
                        <a href="/post/download/${file.watermark_id || file.filename}" download>다운로드⬇️</a>
                    </div>
                </div>
            `;
            } else if (['jpg', 'png', 'gif', 'jpeg'].includes(ext)) {
                fileHtml += `
                <img onclick="openImageModal(this, '${msg.watermark_id[0].insertId}')" 
                     src="/wm_uploads/wm_${file.filename}" 
                     alt="첨부 이미지" 
                     class="message-image" />
            `;
            }
        });
    }


    // 메시지 및 파일 HTML 조합
    div.innerHTML = `
        ${msg.content || ''}
        ${fileHtml}
        ${statusHtml}
        <br><small>${new Date(msg.created_at || Date.now()).toLocaleString()}</small>
    `;

    chatBox.appendChild(div);

    // 새 메시지가 "상대방 메시지"이고, "안읽음"이면 옵저버 등록
    if (
        div.classList.contains('other') &&
        div.querySelector('.message-status')?.dataset.isRead === "0"
    ) {
        observer.observe(div);
    }

    // 메시지 수신 시 항상 맨 아래로
    chatBox.scrollTop = chatBox.scrollHeight;
});


const fileInput = document.getElementById("fileInput");
const filePreview = document.getElementById("filePreview");
// 메시지 & 파일 전송
form.addEventListener('submit', function (e) {
    e.preventDefault();
    const content = input.value.trim();
    const files = fileInput.files;
    console.log(files);

    // 텍스트와 파일 모두 없으면 전송 금지
    if (!content && files.length === 0) return;

    // 파일이 있다면 FormData 사용
    if (files.length > 0) {
        const formData = new FormData();
        formData.append('sender_id', user_id);
        formData.append('receiver_id', receiver_id);
        formData.append('chatting_room_id', chatting_room_id);
        formData.append('content', content);
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }

        // 서버로 파일 업로드 요청
        fetch('/chat/upload', {
            method: 'POST',
            body: formData
        }).then(response => {
            if (response.ok) {
                input.value = '';
                fileInput.value = '';
                filePreview.innerHTML = '';
                // 채팅창 스크롤 맨 아래로
                chatBox.scrollTop = chatBox.scrollHeight;
            }
        });
    } else {
        // 텍스트만 전송
        chatSocket.emit('message', {
            sender_id: user_id,
            receiver_id: receiver_id,
            chatting_room_id: chatting_room_id,
            content,
        });
        input.value = '';
        filePreview.innerHTML = '';
        chatBox.scrollTop = chatBox.scrollHeight;
    }
});

// 서버에서 읽음 알림 수신
chatSocket.on('messageRead', (data) => {
    const messageElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
    if (messageElement) {
        const statusElement = messageElement.querySelector('.message-status');
        statusElement.textContent = '✔️ 읽음';
        statusElement.dataset.isRead = '1';
    }
});

// 이미지 확대 모달
const modal = document.getElementById("imageModal");
const modalImg = document.getElementById("modalImage");
const modalClose = document.getElementById("modalClose");
const downloadBtn = document.getElementById("downloadBtn");

function openImageModal(image, watermark_id) {
    modal.style.display = "block";
    modalImg.src = image.src;
    downloadBtn.href = `/post/download/${watermark_id}`;
}

modalClose.onclick = () => modal.style.display = "none";
window.onclick = (e) => {
    if (e.target === modal) modal.style.display = "none";
};

// 파일 선택 시 미리보기 표시
const file_buffer = new DataTransfer();

fileInput.addEventListener("change", () => {
    // 1. 기존 파일 제거
    file_buffer.items.clear();

    // 2. 새 파일 추가 (첫 번째 파일만 사용)
    const file = fileInput.files[0];
    if (file) {
        file_buffer.items.add(file);
    }

    // 3. 렌더링
    renderFileList();
});

// 파일 미리보기 함수
function renderFileList() {
    // 4. 기존 미리보기 제거
    filePreview.innerHTML = "";

    Array.from(file_buffer.files).forEach((file, index) => {
        const li = document.createElement("li");
        const maxLength = 10;
        li.textContent = file.name.length > maxLength
            ? file.name.slice(0, maxLength) + "..."
            : file.name;

        const remove_btn = document.createElement("button");
        remove_btn.textContent = "❌";
        Object.assign(remove_btn.style, {
            marginLeft: "10px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "red"
        });

        remove_btn.addEventListener("click", (event) => {
            file_buffer.items.remove(index);
            event.target.closest('li').remove();
            fileInput.value = ""; // input도 초기화
        });

        li.appendChild(remove_btn);
        filePreview.appendChild(li);
    });

    // 5. input 파일 재설정
    fileInput.files = file_buffer.files;
}

// 파일 이름에서 확장자 추출 함수
function getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
}