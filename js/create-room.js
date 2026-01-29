document.addEventListener('DOMContentLoaded', () => {

    const token = localStorage.getItem('teacherToken');

    if (!token) {
        window.location.href = './teacher-login.html';
        return;
    }

    const teacherName = localStorage.getItem('teacherName');
    const headerTitle = document.querySelector('.dashboard-header h1');
    if (teacherName && headerTitle) {
        headerTitle.innerHTML = `Welcome, <span style="color: #4169e1">${teacherName}</span>`;
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('teacherToken');
            localStorage.removeItem('teacherName');
            localStorage.removeItem('teacherId');
            window.location.href = '../index.html';
        });
    }
    const createButton = document.querySelector('.create-button-link');

    if (createButton) {
        createButton.addEventListener('click', async (e) => {
            e.preventDefault();

            const titleInput = document.getElementById('sessionTitle');
            const sessionTitle = titleInput.value.trim();

            if (!sessionTitle) {
                alert('Please enter a session title (e.g. Physics Class)');
                return;
            }

            const originalText = createButton.textContent;
            createButton.textContent = 'Creating...';

            try {
                const response = await fetch(`${API_BASE_URL}/rooms`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        title: sessionTitle,
                        subject_id: null
                    })
                });

                const data = await response.json();

                // Handle cases where the backend returns soft errors (200 OK but success: false)
                if (data.success === false) {
                    console.error('API Error:', data);
                    alert(data.detail || 'Failed to create room.');
                    createButton.textContent = originalText;

                    // If unauthorized, redirect to login
                    if (data.detail === 'Unauthorized') {
                        window.location.href = './teacher-login.html';
                    }
                    return;
                }

                if (response.ok) {
                    let roomId;
                    if (data.success === true && data.room) {
                        // New backend format
                        roomId = data.room.id;
                    } else if (data.id) {
                        // Old backend format
                        roomId = data.id;
                    }

                    if (roomId !== undefined && roomId !== null) {
                        window.location.href = `./teacher-dashboard.html?room_id=${roomId}`;
                    } else {
                        console.error('Unexpected Server Response:', data);
                        alert(`Created room but could not find ID. Server returned: ${JSON.stringify(data)}`);
                        createButton.textContent = originalText;
                    }
                } else {
                    console.error('HTTP Error:', data);
                    alert(data.detail || 'Failed to create room. Please try again.');
                    createButton.textContent = originalText;
                }

            } catch (error) {
                console.error('Error creating room:', error);
                alert('Server error. Check backend connection.');
                createButton.textContent = originalText;
            }
        });
    }
});
