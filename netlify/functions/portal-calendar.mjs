import { getStore } from '@netlify/blobs';
import { makeCalendarHandler } from '../lib/calendar-handler.mjs';

export default makeCalendarHandler({
  getEnv:key=>globalThis.Netlify?.env.get(key)||process.env[key],
  storeFor:name=>getStore({name,consistency:'strong'})
});
