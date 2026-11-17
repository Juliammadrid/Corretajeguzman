import { makePropertyWhatsapp } from '../lib/property-whatsapp.mjs';

export default makePropertyWhatsapp({ getEnv: name => Netlify.env.get(name) });
