// public/js/auth.js
// Handles login and registration form submissions

// ============================================================
// HELPERS
// ============================================================

// Show an alert message in the UI
function showAlert(elementId, message, type = 'error') {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.className = `alert alert-${type} show`;
}

// Hide an alert
function hideAlert(elementId) {
  const el = document.getElementById(elementId);
  if (el) el.classList.remove('show');
}

// Set button to loading state
function setLoading(btn, loading, text = 'Submit') {
  btn.disabled = loading;
  btn.innerHTML = loading
    ? '<span class="spinner"></span> Loading...'
    : text;
}

// ============================================================
// DETECT WHICH PAGE WE'RE ON AND ATTACH FORM HANDLERS
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, go to dashboard
  if (localStorage.getItem('token')) {
    window.location.href = '/dashboard';
    return;
  }

  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  // Attach login handler if on login page
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Attach register handler if on register page
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }
});

// ============================================================
// LOGIN HANDLER
// ============================================================
async function handleLogin(e) {
  e.preventDefault(); // Prevent default form submission (page reload)
  hideAlert('alertMsg');

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const btn = document.getElementById('loginBtn');

  // Basic client-side validation
  if (!email || !password) {
    showAlert('alertMsg', 'Please fill in all fields.');
    return;
  }

  setLoading(btn, true, 'Sign In');

  try {
    // Send POST request to backend with user credentials
    const response = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      // Server returned an error (e.g. wrong password)
      throw new Error(data.message || 'Login failed');
    }

    // Save JWT token and user info to localStorage for future requests
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    showAlert('successMsg', 'Login successful! Redirecting...', 'success');

    // Redirect to dashboard after short delay
    setTimeout(() => { window.location.href = '/dashboard'; }, 800);

  } catch (error) {
    showAlert('alertMsg', error.message);
  } finally {
    setLoading(btn, false, 'Sign In');
  }
}

// ============================================================
// REGISTER HANDLER
// ============================================================
async function handleRegister(e) {
  e.preventDefault();
  hideAlert('alertMsg');
  hideAlert('successMsg');

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const btn = document.getElementById('registerBtn');

  // Basic validation
  if (!name || !email || !password) {
    showAlert('alertMsg', 'Please fill in all fields.');
    return;
  }

  if (password.length < 6) {
    showAlert('alertMsg', 'Password must be at least 6 characters.');
    return;
  }

  setLoading(btn, true, 'Create Account');

  try {
    // Send POST request to register endpoint
    const response = await fetch('/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    // Save token after successful registration (auto-login)
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    showAlert('successMsg', 'Account created! Redirecting to dashboard...', 'success');
    setTimeout(() => { window.location.href = '/dashboard'; }, 800);

  } catch (error) {
    showAlert('alertMsg', error.message);
  } finally {
    setLoading(btn, false, 'Create Account');
  }
}
