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
    if (msg.chatting_room_id != chatting_room_id) return;

    const div = document.createElement('div');
    div.className = 'message ';
    div.className += (msg.sender_id == user_id ? 'mine' : 'other');
    div.setAttribute('data-message-id', msg.message_id); // 메시지 ID 속성 추가

    // 읽음 상태 표시 (기본값: 안읽음)
    let statusHtml = '';
    if (msg.is_read == 1) {
        statusHtml = '<span class="message-status" data-is-read="1">✔️읽음</span>';
    } else {
        statusHtml = '<span class="message-status" data-is-read="0">🔵읽지 않음</span>';
    }

    div.innerHTML =
        msg.content +
        ' ' + statusHtml +
        ' <br><small>' +
        new Date(msg.created_at || Date.now()).toLocaleString() +
        '</small>';

    chatBox.appendChild(div);

    // === 새 메시지가 "상대방 메시지"이고, "안읽음"이면 옵저버 등록 ===
    if (
        div.classList.contains('other') &&
        div.querySelector('.message-status')?.dataset.isRead === "0"
    ) {
        observer.observe(div);
    }

    // 메시지 수신 시 항상 맨 아래로
    chatBox.scrollTop = chatBox.scrollHeight;
});

// 메시지 전송
form.addEventListener('submit', function (e) {
    e.preventDefault();
    const content = input.value.trim();
    if (!content) return;

    chatSocket.emit('message', {
        sender_id: user_id,
        receiver_id: receiver_id,
        chatting_room_id: chatting_room_id,
        content,
    });

    input.value = '';
    // 메시지 전송 시 항상 맨 아래로
    chatBox.scrollTop = chatBox.scrollHeight;
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
