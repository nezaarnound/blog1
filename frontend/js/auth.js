// ========== AUTH WITH AXIOS ==========

async function handleRegister(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirmPassword').value;
    
    if (password !== confirm) {
        return showMessage('Passwords do not match!', 'error');
    }
    
    if (password.length < 6) {
        return showMessage('Password must be at least 6 characters!', 'error');
    }
    
    const btn = event.target.querySelector('button');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
    
    try {
        const response = await api.post('/auth/register', { email, password });
        const data = response.data;
        
        showMessage(data.message, data.success ? 'success' : 'error');
        
        if (data.success) {
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }
    } catch (error) {
        const message = error.response?.data?.message || error.message;
        showMessage('Error: ' + message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const btn = event.target.querySelector('button');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    
    try {
        const response =  await api.post('/auth/login', { email, password });
        console.log("response", response.data);

        const token = response.data.token;
console.log("token", token);
        
        const data = response.data;

        // console.log("response", response);
        
        if (data.success) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('userEmail', data.user.email);
            showMessage('Login successful! Redirecting...', 'success');
            setTimeout(() => {
               window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        const message = error.response?.data?.message || error.message;
        showMessage('Error: ' + message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}

function getToken() {
    return localStorage.getItem('token');
}

function getCurrentUser() {
    return {
        id: localStorage.getItem('userId'),
        email: localStorage.getItem('userEmail')
    };
}

function showMessage(message, type) {
    const msgDiv = document.getElementById('message');
    if (msgDiv) {
        msgDiv.textContent = message;
        msgDiv.className = `message ${type}`;
        msgDiv.style.display = 'block';
        setTimeout(() => {
            msgDiv.style.display = 'none';
        }, 5000);
    } else {
        alert(message);
    }
}