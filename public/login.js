const form = document.querySelector('#loginForm');
const message = document.querySelector('#loginMessage');
const button = document.querySelector('#loginButton');

function setMessage(text, type = '') {
  message.textContent = text;
  message.className = `form-message ${type}`;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  setMessage('');

  const username = document.querySelector('#username').value.trim();
  const password = document.querySelector('#password').value;
  if (!username || !password) {
    setMessage('Enter both username and password.', 'error');
    return;
  }

  button.disabled = true;
  button.textContent = 'Logging in…';

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Login failed.');
    window.location.href = '/';
  } catch (error) {
    setMessage(error.message, 'error');
  } finally {
    button.disabled = false;
    button.textContent = 'Log in';
  }
});
