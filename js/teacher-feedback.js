document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.access-form');
    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            const name = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            const submitBtn = document.querySelector('.submit-btn');
            const originalText = submitBtn.textContent;

            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';

            try {
                const response = await fetch(`${API_BASE_URL}/auth/teachers/request-access`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: name,
                        email: email,
                        password: password
                    })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    window.location.href = './success-page.html';
                } else {
                    alert(data.detail || 'Failed to submit request');
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred. Please check if backend is running.');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
});
