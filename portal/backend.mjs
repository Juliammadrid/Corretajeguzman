// No demo rows, role switches or business data in localStorage.
export function createPortalBackend(client) {
  async function activeProfile() {
    const { data, error } = await client.auth.getUser();
    if (error || !data?.user) throw new Error('Inicia sesión con Google para continuar.');
    const result = await client.from('corredores').select('*').eq('user_id', data.user.id).maybeSingle();
    if (result.error) throw new Error('No pudimos consultar tu perfil. Inténtalo nuevamente.');
    if (!result.data || result.data.estado !== 'activa') {
      await client.auth.signOut({ scope: 'local' });
      throw new Error('Tu cuenta no tiene acceso activo. Contacta a Corretaje Guzmán.');
    }
    return result.data;
  }

  async function counts() {
    const profile = await activeProfile();
    const tables = ['prospectos', 'visitas', 'pagos'];
    const results = await Promise.all(tables.map(table =>
      client.from(table).select('id', { count: 'exact', head: true })
    ));
    if (results.some(r => r.error)) throw new Error('No pudimos consultar tu cartera. No se han cargado datos de ejemplo.');
    return { profile, counts: Object.fromEntries(tables.map((name, i) => [name, results[i].count ?? 0])) };
  }

  async function saveProspect(input, id) {
    const profile = await activeProfile();
    const numeric = v => v === '' || v == null ? null : Number(v);
    const body = {
      nombre: String(input.nombre ?? '').trim(), telefono: String(input.telefono ?? '').trim(),
      email: String(input.email ?? '').trim() || null,
      renta: numeric(input.renta), complementa: input.complementa === true,
      renta_total: input.complementa === true ? numeric(input.renta_total) : null,
      dicom: input.dicom ?? 'nosabe', pie: input.pie === true,
      pie_monto: input.pie === true ? numeric(input.pie_monto) : null,
      estado: input.estado ?? 'nuevo', notas: String(input.notas ?? '').trim(),
      comuna_preferida: String(input.comuna_preferida ?? '').trim(),
      dormitorios_min: numeric(input.dormitorios_min), destino_compra: input.destino_compra || 'primera'
    };
    if (!body.nombre || !body.telefono || body.renta == null) throw new Error('Completa nombre, teléfono y renta.');
    if (!['limpio','obs','nosabe'].includes(body.dicom) || !['nuevo','contactado','interesado','no'].includes(body.estado) || !['primera','inversion','segunda'].includes(body.destino_compra)) throw new Error('Revisa los datos seleccionados.');
    if (body.comuna_preferida.length > 100 || (body.dormitorios_min !== null && (!Number.isInteger(body.dormitorios_min) || body.dormitorios_min < 0 || body.dormitorios_min > 6))) throw new Error('Revisa las preferencias del cliente.');
    if (body.complementa && (body.renta_total == null || body.renta_total < body.renta)) throw new Error('Ingresa la renta total complementada, incluyendo la renta individual.');
    if (body.pie && body.pie_monto == null) throw new Error('Indica el monto del pie disponible.');
    for (const name of ['renta', 'renta_total', 'pie_monto']) {
      if (body[name] !== null && (!Number.isSafeInteger(body[name]) || body[name] < 0)) {
        throw new Error('Los montos deben ser números enteros no negativos.');
      }
    }
    let request;
    if (id) {
      // Never allow changing owner or overwriting the original consent timestamp.
      request = client.from('prospectos').update(body).eq('id', id);
    } else {
      if (input.acepta !== true) throw new Error('Confirma la autorización del cliente antes de guardar.');
      request = client.from('prospectos').insert({ ...body, corredor_id: profile.id, acepta_politica_at: new Date().toISOString() });
    }
    const result = await request.select('*').single();
    if (result.error) throw new Error('No se pudo guardar el prospecto. Tus cambios no se han confirmado.');
    return result.data;
  }

  async function listProspects() {
    await activeProfile();
    const rows = [];
    for (let offset = 0; ; offset += 500) {
      const result = await client.from('prospectos').select('*').order('creado', { ascending:false }).order('id').range(offset, offset + 499);
      if (result.error) throw new Error('No pudimos cargar los prospectos. Inténtalo nuevamente.');
      rows.push(...result.data);
      if (result.data.length < 500) return rows;
    }
  }
  async function listRows(table) {
    const rows = [];
    for (let offset = 0; ; offset += 500) {
      const result = await client.from(table).select('*').order('id').range(offset, offset + 499);
      if (result.error) throw new Error('No pudimos cargar ' + table + '. No se muestran datos de ejemplo.');
      rows.push(...result.data);
      if (result.data.length < 500) return rows;
    }
  }
  async function snapshot() {
    const profile = await activeProfile();
    const [prospects, visits, brokers, payments] = await Promise.all(
      ['prospectos','visitas','corredores','pagos'].map(listRows));
    return {profile, prospects, visits, brokers, payments};
  }
  return Object.freeze({ activeProfile, counts, saveProspect, listProspects, snapshot });
}
