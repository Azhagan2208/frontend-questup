document.addEventListener('DOMContentLoaded', async () => {

    const token = localStorage.getItem('teacherToken');
    if (!token) {
        window.location.href = './teacher-login.html';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('room_id');

    if (!roomId || roomId === 'undefined') {
        alert('No room specified!');
        window.location.href = './create-room.html';
        return;
    }

    await loadRoomDetails(roomId, token);

    await loadQuestions(roomId, token);

    setInterval(() => {
        loadQuestions(roomId, token);
    }, 5000);
    const copyBtn = document.querySelector('.copy-btn');
    copyBtn.addEventListener('click', () => {
        const codeText = document.querySelector('.room-code').textContent;
        navigator.clipboard.writeText(codeText);
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(() => copyBtn.textContent = originalText, 2000);
    });
});

async function loadRoomDetails(roomId, token) {
    try {
        const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (response.ok) {
            document.querySelector('.room-title h1').textContent = data.title;
            document.querySelector('.session-id strong').textContent = data.room_code;
            document.querySelector('.room-code').textContent = data.room_code;
        }
    } catch (error) {
        console.error('Error loading room:', error);
    }
}

async function loadQuestions(roomId, token) {
    try {
        const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/questions?sort=votes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (response.ok && data.success) {
            const questions = data.questions || [];

            updateStats(questions);
            renderQuestionsList(questions, roomId, token);
        }
    } catch (error) {
        console.error('Error loading questions:', error);
    }
}


function updateStats(questions) {
    const total = questions.length;
    const answered = questions.filter(q => q.is_solved).length;
    const pending = total - answered;

    const statValues = document.querySelectorAll('.stat-value');
    if (statValues.length >= 3) {
        statValues[0].textContent = total;
        statValues[1].textContent = pending;
        statValues[2].textContent = answered;
    }
}

function renderQuestionsList(questions, roomId, token) {
    const emptyState = document.querySelector('.empty-state');

    if (questions.length === 0) {
        emptyState.style.display = 'block';
        const existingList = document.getElementById('questions-list');
        if (existingList) existingList.innerHTML = '';
        return;
    }
    emptyState.style.display = 'none';

    let listContainer = document.getElementById('questions-list');
    if (!listContainer) {
        listContainer = document.createElement('div');
        listContainer.id = 'questions-list';
        listContainer.style.marginTop = '20px';

        const optionsRow = document.querySelector('.options-row');
        optionsRow.parentNode.insertBefore(listContainer, optionsRow.nextSibling);
    }
    listContainer.innerHTML = questions.map(q => `
        <div class="question-item" style="
            background: white; 
            padding: 20px; 
            margin-bottom: 15px; 
            border-radius: 10px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            border-left: 5px solid ${q.is_solved ? '#28a745' : '#4169e1'};
            display: flex;
            justify-content: space-between;
            align-items: center;
        ">
            <div style="flex: 1;">
                <h3 style="margin-bottom: 5px; font-size: 16px;">
                    ${escapeHtml(q.title)}
                    ${q.is_solved ? '<span style="color: green; font-size: 12px; margin-left: 10px;">(SOLVED)</span>' : ''}
                </h3>
                <p style="color: #666; font-size: 13px;">
                    Asked by ${q.student_name || 'Anonymous'} • ${new Date(q.created_at).toLocaleTimeString()}
                </p>
                <div style="margin-top: 5px; font-weight: bold; color: #555;">
                    👍 ${countVotes(q)} Votes
                </div>
            </div>

            <div>
                ${!q.is_solved ? `
                    <button onclick="markAsSolved(${q.id}, '${token}')" style="
                        background: #28a745; 
                        color: white; 
                        border: none; 
                        padding: 8px 15px; 
                        border-radius: 5px; 
                        cursor: pointer;
                    ">
                        Mark as Done
                    </button>
                ` : `
                    <button disabled style="
                        background: #ccc; 
                        color: white; 
                        border: none; 
                        padding: 8px 15px; 
                        border-radius: 5px; 
                    ">
                        Done
                    </button>
                `}
            </div>
        </div>
    `).join('');
}

async function markAsSolved(questionId, token) {
    if (!confirm('Mark this question as answered?')) return;

    try {
        await fetch(`${API_BASE_URL}/questions/${questionId}/solve`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const urlParams = new URLSearchParams(window.location.search);
        loadQuestions(urlParams.get('room_id'), token);
    } catch (error) {
        alert('Error updating question');
    }
}

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function countVotes(q) {
    return q.votes || 0;
}










