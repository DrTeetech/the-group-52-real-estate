const currency = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

export default function PaymentStats({ payments = [] }) {
  const successful = payments.filter((payment) => payment.status === 'Successful');
  const pending = payments.filter((payment) => payment.status === 'Pending');
  const failed = payments.filter((payment) => payment.status === 'Failed');
  const overdue = payments.filter((payment) => payment.status === 'Overdue');
  const totalCollected = successful.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const pendingAmount = [...pending, ...failed, ...overdue].reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <span className="eyebrow">Collected</span>
        <h3>{currency.format(totalCollected)}</h3>
        <small>{successful.length} successful payments</small>
      </div>
      <div className="stat-card">
        <span className="eyebrow">Outstanding</span>
        <h3>{currency.format(pendingAmount)}</h3>
        <small>{pending.length + failed.length + overdue.length} pending items</small>
      </div>
      <div className="stat-card">
        <span className="eyebrow">Successful</span>
        <h3>{successful.length}</h3>
        <small>Confirmed settlements</small>
      </div>
      <div className="stat-card">
        <span className="eyebrow">Failed & late</span>
        <h3>{failed.length + overdue.length}</h3>
        <small>Needs attention</small>
      </div>
    </div>
  );
}
