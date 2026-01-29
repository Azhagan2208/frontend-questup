document.addEventListener('DOMContentLoaded', () => {
    const input = document.querySelector('input[type="text"]');
    const joinBtn = document.querySelector('.join-link');
    if (joinBtn) {
        joinBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const roomCode = input.value.trim().toUpperCase();
            if (!roomCode) {
                alert('Please enter a room code');
                return;
            }
            const originalText = joinBtn.textContent;
            joinBtn.textContent = 'Joining...';
            joinBtn.style.opacity = '0.7';
            joinBtn.style.pointerEvents = 'none';

            try {
                const response = await fetch(`${API_BASE_URL}/rooms/join`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ room_code: roomCode })
                });

                const data = await response.json();

                if (response.ok && data.success) {

                    localStorage.setItem('studentRoomId', data.room.id);
                    localStorage.setItem('studentRoomCode', data.room.room_code);
                    window.location.href = './post-doubt.html';

                } else {
                    alert('Room not found! Please check the code.');
                    joinBtn.textContent = originalText;
                    joinBtn.style.opacity = '1';
                    joinBtn.style.pointerEvents = 'auto';
                }

            } catch (error) {
                console.error(error);
                alert('Could not connect to server.');
                joinBtn.textContent = originalText;
                joinBtn.style.opacity = '1';
                joinBtn.style.pointerEvents = 'auto';
            }
        });
    }
    if (input) {
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
    }
});
