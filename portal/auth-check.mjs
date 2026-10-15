import { makeClient } from './auth.mjs';
import { enterPortal } from './enter-portal.mjs';
const $ = id => document.getElementById(id);
let client;
try {
  client = makeClient();
  await enterPortal(client);
} catch (error) {
  $('status').textContent = error.message;
  $('status').classList.add('error'); $('retry').hidden = false;
}
