import { makeClient, googleSignIn } from './auth.mjs';
const button = document.getElementById('gBtn');
const message = document.getElementById('denied');
message.setAttribute('role', 'alert');
button.addEventListener('click', async () => {
  button.disabled = true;
  message.style.display = 'none';
  try { await googleSignIn(makeClient()); }
  catch (error) {
    message.textContent = error.message;
    message.style.display = 'block';
    button.disabled = false;
  }
});
