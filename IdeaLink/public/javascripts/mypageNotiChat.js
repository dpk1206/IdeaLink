// 채팅 창
function chatWindow(user_id, writer_id, post_id, type) {

    if (!confirm("본 채팅방에서 이루어지는 모든 대화는 비밀 보장이 원칙이며, 제3자에게 공개하거나 유출해서는 안 됩니다.")) {
        return;
    }
    // 1. 폼 요소 생성
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/chat';
    form.target = 'chatWindow'; // 새 창 이름

    // 2. 필요한 데이터 input 요소로 추가
    const params = {
        sender_id: user_id,
        receiver_id: writer_id,
        post_id: post_id,
        type: type
    };

    for (const key in params) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = params[key];
        form.appendChild(input);
    }

    // 3. 폼을 body에 추가
    document.body.appendChild(form);

    // 4. 새 창을 먼저 연 뒤 폼 제출
    const width = 600;
    const height = 800;
    const left = (window.screen.width - width) / 2; // 화면 가로 중앙
    const top = (window.screen.height - height) / 2; // 화면 세로 중앙
    window.open(
        '', // URL (필요시 입력)
        'chatWindow',
        `width=${width},height=${height},resizable=yes,scrollbars=yes,left=${left},top=${top}`
    );
    form.submit();

    // 5. 폼 제거(클린업)
    document.body.removeChild(form);
}

// ===== 🔔 알림 기능 =====
// 알림 읽음 처리
async function markAsRead(btn, notification_id, type) {
    try {
        const response = await fetch('/users/notification/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notification_id: notification_id, type: type })
        });

        if (response.ok) {
            alert('읽음 처리되었습니다.');

            // 버튼이 속한 li 요소 찾기
            const liElement = btn.closest('li');
            liElement.classList.add('read');

            // 해당 li 내부의 .chat-unread 요소 찾기
            const chatUnreadEl = liElement.querySelector('.chat-unread');
            const currentText = chatUnreadEl.textContent;

            // 1. 숫자 추출 (안전한 처리)
            const match = currentText.match(/\d+/);
            const num = match ? parseInt(match[0], 10) : 1; // 숫자 없으면 1으로 처리
            chatUnreadEl.textContent = '';

            // 2. 모든 알림 요소 업데이트 (안전한 처리)
            document.querySelectorAll('.notification').forEach(el => {
                const elementText = el.textContent;
                const elementMatch = elementText.match(/\d+/);

                if (elementMatch) {
                    const notiNum = parseInt(elementMatch[0], 10);
                    const newNum = notiNum - num;
                    el.textContent = newNum > 0 ? `• ${newNum}` : '';
                } else {
                    el.textContent = ''; // 숫자가 없는 경우 빈 문자열
                }
            });

            // 버튼 비활성화
            btn.disabled = true;
        } else {
            alert('읽음 처리에 실패했습니다.');
        }
    } catch (err) {
        console.error('에러:', err);
        alert('서버 오류가 발생했습니다.');
    }
}


// 알림 삭제
async function deleteNotification(btn, notification_id, type) {
    try {
        const response = await fetch('/users/notification/delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notification_id: notification_id, type: type })
        });
        if (response.ok) {
            alert('삭제 처리되었습니다.');

            // 버튼이 속한 li 요소 찾기
            const liElement = btn.closest('li');

            // 해당 li 내부의 .chat-unread 요소 찾기
            if (!liElement.classList.contains('read')) {
                const chatUnreadEl = liElement.querySelector('.chat-unread');
                const currentText = chatUnreadEl.textContent;
                // "• 2" 형태에서 숫자만 추출
                const match = currentText.match(/\d+/);
                const num = match ? parseInt(match[0], 10) : 1; // 숫자 없으면 1으로 처리
                document.querySelectorAll('.notification').forEach(el => {
                    const notiMatch = el.textContent.match(/\d+/);
                    if (notiMatch) {
                        const notiNum = parseInt(notiMatch[0], 10);
                        if (notiNum - num <= 0) {
                            el.textContent = '';
                        } else {
                            el.textContent = `• ${notiNum - num}`;
                        }
                    }
                });
            }
            // 알림 li 삭제
            liElement.remove();
        } else {
            alert('삭제 처리에 실패했습니다.');
        }
    } catch (error) {
        alert('에러 발생: ' + error);
    }
}

// 모든 알림 읽음
async function markAllAsRead() {
    try {
        const response = await fetch('/users/notification/readAll', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            alert('모든 알림이 읽음 처리되었습니다.');
            // 모든 알림 li에 'read' 클래스 추가
            document.querySelectorAll('.alert-item:not(.read)').forEach(el => {
                el.querySelector('.chat-unread').textContent = ''; // 채팅 알림 숫자 초기화
                el.classList.add('read');
            });
            // 헤더의 알림 개수 초기화
            document.querySelectorAll('.notification').forEach(el => {
                el.textContent = '';
            });
        } else {
            alert('읽음 처리에 실패했습니다.');
        }
    } catch (err) {
        console.error('에러:', err);
        alert('서버 오류가 발생했습니다.');
    }
}

// 모든 알림 삭제
async function deleteAllNotifications() {
    try {
        const response = await fetch('/users/notification/deleteAll', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            alert('모든 알림이 삭제되었습니다.');
            // 모든 알림 li 삭제
            document.querySelectorAll('.alert-item').forEach(el => {
                el.remove();
            });
            // 헤더의 알림 개수 초기화
            document.querySelectorAll('.notification').forEach(el => {
                el.textContent = '';
            });
        } else {
            alert('삭제 처리에 실패했습니다.');
        }
    } catch (err) {
        console.error('에러:', err);
        alert('서버 오류가 발생했습니다.');
    }
}
