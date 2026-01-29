const API_URL = 'http://localhost:8000';

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

function getSecret() {
    return localStorage.getItem('admin_secret');
}

function checkAuth() {
    const secret = getSecret();
    if (secret) {
        // Verify token with simple check or just show dashboard
        showDashboard();
        fetchRequests();
    } else {
        showLogin();
    }
}

function showLogin() {
    document.getElementById('loginSection').style.display = 'flex';
    document.getElementById('dashboardSection').style.display = 'none';
    document.getElementById('adminControls').innerHTML = '';
}

function showDashboard() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';

    document.getElementById('adminControls').innerHTML = `
        <button onclick="logout()">
            <i class="fas fa-sign-out-alt"></i> Logout
        </button>
    `;
}

async function handleLogin() {
    const emailInput = document.getElementById('adminEmail');
    const passwordInput = document.getElementById('adminPassword');

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        showToast('Please enter both email and password', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/teachers/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // The backend returns the secret as 'token'
            localStorage.setItem('admin_secret', data.token);
            showDashboard();
            fetchRequests();
            showToast('Welcome Admin', 'success');
        } else {
            showToast(data.detail || 'Invalid Credentials', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Connection error', 'error');
    }
}

function logout() {
    localStorage.removeItem('admin_secret');
    showLogin();
}

async function fetchRequests() {
    const secret = getSecret();
    if (!secret) return;

    try {
        const response = await fetch(`${API_URL}/auth/teachers/requests`, {
            headers: {
                'x-admin-secret': secret
            }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        const data = await response.json();
        if (data.success) {
            renderStats(data.stats);
            renderRequests(data.requests);
            renderHistory(data.history);
        } else {
            showToast('Failed to fetch requests', 'error');
        }
    } catch (error) {
        console.error('Fetch error:', error);
        showToast('Error fetching data', 'error');
    }
}

function renderRequests(requests) {
    const tbody = document.getElementById('requestsTableBody');
    const countEl = document.getElementById('pendingCount');
    const emptyState = document.getElementById('emptyState');
    const table = document.querySelector('.requests-table');

    tbody.innerHTML = '';
    countEl.textContent = requests.length;

    if (requests.length === 0) {
        table.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    table.style.display = 'table';
    emptyState.style.display = 'none';

    requests.forEach(req => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div style="font-weight: 500;">${req.name}</div>
            </td>
            <td>${req.email}</td>
            <td>${new Date(req.created_at).toLocaleDateString()}</td>
            <td>
                <button class="action-btn btn-approve" onclick="approveRequest(${req.id}, '${req.email}')">
                    Approve
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderStats(stats) {
    if (!stats) return;
    document.getElementById('pendingCount').textContent = stats.pending || 0;
    document.getElementById('approvedCount').textContent = stats.approved || 0;
    document.getElementById('totalCount').textContent = stats.total || 0;
}

function renderHistory(history) {
    const tbody = document.getElementById('historyTableBody');
    const emptyState = document.getElementById('historyEmptyState');
    const table = document.getElementById('historyTableBody').closest('table');

    tbody.innerHTML = '';

    if (!history || history.length === 0) {
        table.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    table.style.display = 'table';
    emptyState.style.display = 'none';

    history.forEach(req => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div style="font-weight: 500;">${req.name}</div>
            </td>
            <td>${req.email}</td>
            <td>${new Date(req.created_at).toLocaleDateString()}</td>
             <td>
                <span class="status-badge status-approved">
                    <i class="fas fa-check-circle"></i> Approved
                </span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function approveRequest(id, email) {
    if (!confirm(`Approve teacher ${email}?`)) return;

    const secret = getSecret();

    try {
        const response = await fetch(`${API_URL}/auth/teachers/approve/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-secret': secret
            },
            body: JSON.stringify({})
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showToast(`Approved ${email}`, 'success');
            fetchRequests(); // Refresh list
        } else {
            showToast(data.detail || 'Approval failed', 'error');
        }
    } catch (error) {
        console.error('Approval error:', error);
        showToast('Error approving request', 'error');
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}
