document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            if (!email || !password) {
                alert('Please enter both email and password');
                return;
            }
            const submitButton = loginForm.querySelector('button');
            const originalButtonText = submitButton.textContent;
            submitButton.textContent = 'Signing in...';
            submitButton.disabled = true;

            try {
                const response = await fetch("http://localhost:8000/auth/login", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email: email, password: password })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    localStorage.setItem('teacherToken', data.token);
                    localStorage.setItem('teacherName', data.teacher.name);
                    localStorage.setItem('teacherId', data.teacher.id);
                    window.location.href = './create-room.html';
                } else {
                    alert(data.detail || 'Login failed! Please check your credentials.');
                    submitButton.textContent = originalButtonText;
                    submitButton.disabled = false;
                }

            } catch (error) {
                console.error('Login error:', error);
                alert('Could not connect to the server. Is the backend running?');
                submitButton.textContent = originalButtonText;
                submitButton.disabled = false;
            }
        });
    }
});
