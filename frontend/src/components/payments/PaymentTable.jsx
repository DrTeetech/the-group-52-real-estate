import { Link } from 'react-router-dom';
import PaymentStatusBadge from './PaymentStatusBadge';

const currency = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

export default function PaymentTable({ payments = [] }) {
  if (!payments.length) {
    return (
      <div className="panel-card">
        <div className="empty-state-box">
          <h3>No payment records match your filters.</h3>
          <p>Try adjusting the search or reset the payment filters to see more entries.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-wrap panel-card">
      <table>
        <thead>
          <tr>
            <th>Payment</th>
            <th>Tenant</th>
            <th>Property</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Due</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td>
                <strong>{payment.paymentId || payment.id}</strong>
                <div>{payment.transactionReference || 'No reference yet'}</div>
              </td>
              <td>{payment.tenantName || payment.tenant || 'Unassigned'}</td>
              <td>{payment.propertyName || payment.property || 'Unassigned'}</td>
              <td>{currency.format(Number(payment.amount || 0))}</td>
              <td>{payment.paymentMethod || payment.method || 'N/A'}</td>
              <td>{payment.dueDate || payment.date || '—'}</td>
              <td><PaymentStatusBadge status={payment.status || 'Pending'} /></td>
              <td>
                <Link to={`/payments/${payment.id}`} className="text-link">View</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
