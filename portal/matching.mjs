// Pure estimates. No bank approval, inventory guarantee or automatic pie financing.
export function installment(principal, annualRate, years) {
  const r = annualRate / 1200, n = years * 12;
  return r === 0 ? principal / n : principal * r / (1 - (1 + r) ** -n);
}
export function creditCapacity(payment, annualRate, years) {
  return payment / installment(1, annualRate, years);
}
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
const validMoney = value => value !== null && value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0;

export function matchProspect(prospect, catalog, config) {
  const { uf, tasaAnual, cargaMax, anios = 25, financiaBanco } = config;
  const financing = financiaBanco[prospect.destino_compra || 'primera'];
  if (!(uf > 0) || !(tasaAnual >= 0 && tasaAnual <= 30) || !(anios > 0 && anios <= 40) || !(cargaMax > 0 && cargaMax <= .5) || !(financing > 0 && financing < 1)) throw new Error('Supuestos de cálculo inválidos.');
  const missing = [];
  const incomeValue = prospect.complementa ? prospect.renta_total : prospect.renta;
  if (!validMoney(incomeValue) || Number(incomeValue) <= 0) missing.push('Completa la renta líquida' + (prospect.complementa ? ' total complementada' : '') + '.');
  if (prospect.complementa && Number(incomeValue) < Number(prospect.renta)) missing.push('La renta total complementada no puede ser menor a la individual.');
  if (prospect.pie && !validMoney(prospect.pie_monto)) missing.push('Indica el monto del pie disponible.');
  const income = Number(incomeValue) || 0;
  const savings = prospect.pie ? Number(prospect.pie_monto) || 0 : 0;
  const maxPayment = income * cargaMax;
  const maxCredit = creditCapacity(maxPayment, tasaAnual, anios);
  const rows = [];
  let excluded = 0;
  for (const project of catalog.projects) {
    if (project.activa === false || !project.detalle) continue;
    if (prospect.comuna_preferida && normalize(project.commune) !== normalize(prospect.comuna_preferida)) continue;
    for (const type of project.types) {
      const priceUF = Number(type.desdeUF);
      if (!(priceUF > 0) || !Number.isFinite(priceUF)) { excluded++; continue; }
      if (prospect.dormitorios_min != null && (type.dormitorios == null || type.dormitorios < prospect.dormitorios_min)) continue;
      const price = priceUF * uf;
      const minimumDown = price * (1 - financing);
      // Apply a larger available down payment: do not reject clients who need less credit.
      const ownDown = Math.min(savings, price);
      const principal = Math.max(0, price - Math.max(ownDown, minimumDown));
      const payment = installment(principal, tasaAnual, anios);
      const gapDown = Math.max(0, minimumDown - ownDown);
      const extraIncome = Math.max(0, payment / cargaMax - income);
      const reasons = [];
      if (gapDown > .01) reasons.push('Falta pie; cualquier pago en cuotas requiere confirmación de la inmobiliaria.');
      if (extraIncome > .01) reasons.push('La renta registrada no cubre el dividendo bajo estos supuestos.');
      const review = prospect.dicom !== 'limpio';
      if (review) reasons.push(prospect.dicom === 'obs' ? 'Antecedentes con observaciones: requiere revisión, no implica aprobación ni rechazo automático.' : 'Situación crediticia por confirmar.');
      let status = extraIncome > .01 ? 'sobre_renta' : gapDown > .01 ? 'requiere_pie' : review ? 'revisar' : 'posible';
      if (missing.length) status = 'incompleto';
      rows.push({ project, type, priceUF, price, minimumDown, ownDown, principal, payment, gapDown, extraIncome, status, reasons });
    }
  }
  const order = { posible:0, revisar:1, requiere_pie:2, sobre_renta:3, incompleto:4 };
  rows.sort((a,b)=>order[a.status]-order[b.status] || a.priceUF-b.priceUF || a.type.id.localeCompare(b.type.id));
  return { income, savings, maxPayment, maxCredit, missing, rows, excluded,
    possible:rows.filter(x=>x.status==='posible').length };
}
