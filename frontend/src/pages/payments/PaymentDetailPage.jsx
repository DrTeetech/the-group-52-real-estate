import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePayments } from '../../context/PaymentContext';
import PaymentStatusBadge from '../../components/payments/PaymentStatusBadge';
import { roleNavigation } from '../../data/mockData';
import { ROLE } from '../../data/roles';
import DashboardLayout from '../../layouts/DashboardLayout';

const currency = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

export default function PaymentDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { findPaymentById, updatePayment } = usePayments();
  const [notice, setNotice] = useState('');

  const payment = useMemo(() => findPaymentById(id), [id, findPaymentById]);

  if (!payment) {
    return (
      <DashboardLayout user={user} title="Payment" subtitle="Record" navItems={roleNavigation[user.role]}>
        <div className="panel-card">
          <h2>Payment not found</h2>
          <p>The payment record you’re looking for is not available in the demo dataset.</p>
          <Link to="/payments" className="primary-button">Back to payments</Link>
        </div>
      </DashboardLayout>
    );
  }

  const canManage = user?.role === ROLE.ADMIN || user?.role === ROLE.PROPERTY_MANAGER;

  const handleStatusChange = async (status) => {
    try {
      await updatePayment(payment.id, { status });
      setNotice(`Payment updated to ${status}.`);
    } catch (error) {
      setNotice(error.message || 'Unable to update this payment.');
    }
  };

  return (
    <DashboardLayout user={user} title="Payment detail" subtitle="Record" navItems={roleNavigation[user.role]}>
      <div className="page-header">
        <div>
          <span className="eyebrow">Payment record</span>
          <h2>{payment.paymentId || payment.id}</h2>
        </div>
        <div className="toolbar-actions">
          <Link to="/payments" className="secondary-button">Back to list</Link>
          {canManage && (
            <>
              <button type="button" className="secondary-button" onClick={() => handleStatusChange('Successful')}>Mark successful</button>
              <button type="button" className="danger-button" onClick={() => handleStatusChange('Failed')}>Mark failed</button>
            </>
          )}
        </div>
      </div>

      {notice && <div className="form-message success-message">{notice}</div>}

      <div className="panel-grid two-col">
        <div className="panel-card">
          <div className="panel-header with-actions">
            <div>
              <span className="eyebrow">Summary</span>
              <h3>{payment.tenantName || payment.tenant || 'Tenant'}</h3>
            </div>
            <PaymentStatusBadge status={payment.status || 'Pending'} />
          </div>
          <div className="mini-list">
            <div><span>Property</span><strong>{payment.propertyName || payment.property || 'Not selected'}</strong></div>
            <div><span>Lease</span><strong>{payment.leaseId || '—'}</strong></div>
            <div><span>Method</span><strong>{payment.paymentMethod || payment.method || 'N/A'}</strong></div>
            <div><span>Type</span><strong>{payment.paymentType || payment.type || 'N/A'}</strong></div>
            <div><span>Amount</span><strong>{currency.format(Number(payment.amount || 0))}</strong></div>
            <div><span>Due date</span><strong>{payment.dueDate || payment.date || '—'}</strong></div>
            <div><span>Paid date</span><strong>{payment.paidDate || 'Pending'}</strong></div>
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Reference</span>
              <h3>{payment.transactionReference || 'No reference'}</h3>
            </div>
          </div>
          <div className="mini-list">
            <div><span>Amount</span><strong>{currency.format(Number(payment.amount || 0))}</strong></div>
            <div><span>Currency</span><strong>{payment.currency || 'NGN'}</strong></div>
            <div><span>Description</span><strong>{payment.description || 'No description provided'}</strong></div>
            <div><span>Created</span><strong>{payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : '—'}</strong></div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
