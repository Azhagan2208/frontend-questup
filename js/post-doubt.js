document.addEventListener('DOMContentLoaded', () => {
    const roomId = localStorage.getItem('studentRoomId');
    const roomCode = localStorage.getItem('studentRoomCode');
    if (!roomId) {
        window.location.href = './join-room.html';
        return;
    }
    const sessionInfoElement = document.querySelector('.session-info p');
    if (sessionInfoElement) {
        sessionInfoElement.textContent = `Room: ${roomCode}`;
    }
    loadQuestions();
    const exitLink = document.querySelector('.exit-text');
    if (exitLink) {
        exitLink.addEventListener('click', () => {
            localStorage.removeItem('studentRoomId');
            localStorage.removeItem('studentRoomCode');
        });
    }
    setInterval(loadQuestions, 5000);
    const submitBtn = document.querySelector('.submit-btn');
    const textarea = document.querySelector('.ask-textarea');
    const charCount = document.querySelector('.char-count');
    if (textarea) {
        textarea.addEventListener('input', () => {
            const len = textarea.value.length;
            charCount.textContent = `${len}/500`;
            if (len > 500) {
                charCount.style.color = 'red';
                submitBtn.disabled = true;
            } else {
                charCount.style.color = '#666';
                submitBtn.disabled = false;
            }
        });
    }
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const content = textarea.value.trim();

            if (!content) {
                alert('Please type a question first');
                return;
            }
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Posting...';
            submitBtn.disabled = true;
            try {
                const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/questions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: content,
                        student_name: 'Anonymous'
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    textarea.value = '';
                    charCount.textContent = '0/500';
                    alert('Question posted successfully!');
                    loadQuestions();
                } else {
                    alert('Failed to post question.');
                }

            } catch (error) {
                console.error(error);
                alert('Server error.');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});
async function loadQuestions() {
    const roomId = localStorage.getItem('studentRoomId');
    let questionsList = document.getElementById('questionsList');
    if (!questionsList) {
        questionsList = document.createElement('div');
        questionsList.id = 'questionsList';
        const title = document.querySelector('.class-title');
        if (title) {
            title.parentNode.insertBefore(questionsList, title.nextSibling);
        }
    }

    try {
        const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/questions?sort=recent`);
        const data = await response.json();

        if (response.ok && data.success) {
            const questions = data.questions || [];
            const title = document.querySelector('.class-title');
            if (title) title.textContent = `Class Questions (${questions.length})`;
            questionsList.innerHTML = questions.map(q => createQuestionHTML(q)).join('');
        }
    } catch (error) {
        console.error('Error loading questions', error);
    }
}

function createQuestionHTML(q) {
    const timeString = new Date(q.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const solvedBadge = q.is_solved ? '<span style="color:green; font-weight:bold; margin-left:10px;">(Solved)</span>' : '';
    const isLiked = localStorage.getItem(`liked_${q.id}`) ? 'liked' : '';
    const likeText = isLiked ? 'Liked' : 'Like';
    const voteCount = q.votes !== undefined ? q.votes : 0;
    return `
    <div class="question-card" style="margin-bottom: 15px;">
      <p class="question-text">
        ${escapeHtml(q.title)}
        ${solvedBadge}
      </p>

      <div class="question-footer">
        <!-- Like Button -->
        <button 
           class="like-btn ${isLiked}" 
           onclick="handleVote(${q.id}, this)"
           style="${isLiked ? 'color: #2196f3; font-weight:bold;' : ''}"
        >
            👍 ${likeText} (${voteCount})
        </button>
      </div>
    </div>
    `;
}

async function handleVote(questionId, btn) {
    if (localStorage.getItem(`liked_${questionId}`)) {
        alert('You already liked this question!');
        return;
    }

    let text = btn.textContent;
    let match = text.match(/\((\d+)\)/);
    let count = match ? parseInt(match[1]) : 0;
    let newCount = count + 1;

    btn.innerHTML = `👍 Liked (${newCount})`;
    btn.style.color = '#2196f3';
    btn.style.fontWeight = 'bold';
    try {
        await fetch(`${API_BASE_URL}/questions/${questionId}/vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                vote_type: 'up',
                voter_token: 'student-' + Date.now()
            })
        });

        localStorage.setItem(`liked_${questionId}`, 'true');

    } catch (error) {
        console.error(error);
        btn.innerHTML = `👍 Like (${count})`;
        btn.style.color = '';
        btn.style.fontWeight = '';
        alert('Vote failed');
    }
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
