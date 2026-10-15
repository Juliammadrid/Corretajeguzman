// Display the broker's half, never the agency-wide commission.
export function brokerCommission(p){
  const value=p.moneda==='UF'?(Number.isFinite(p.comisionUF)?p.comisionUF/2:null):p.comisionCorredor;
  return Number.isFinite(value)&&value>=0?value:null;
}
