import { useEffect, useState } from 'react';
import { api } from '../api/client';

function formatWhen(value) {
  return new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api('/orders/mine')
      .then((data) => {
        if (active) {
          setOrders(data.orders);
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="page-panel no-print">
      <section className="cart-panel">
        <div className="section-heading">
          <h2>My Orders</h2>
          <p>Cash-on-delivery orders placed with your account.</p>
        </div>
        {loading ? <p className="status-line">Loading orders…</p> : null}
        {error ? (
          <p className="notice notice-error" role="alert">
            {error}
          </p>
        ) : null}
        {!loading && orders.length === 0 ? (
          <div className="empty-cart">
            <p>You have not placed an order yet.</p>
          </div>
        ) : null}
        <div className="order-list">
          {orders.map((order) => (
            <article className="order-card" key={order.id}>
              <header>
                <strong>{order.invoiceNumber}</strong>
                <span className={`status status-${order.status}`}>{order.status}</span>
              </header>
              <p>{formatWhen(order.createdAt)} · {order.customerName}</p>
              <p>{order.customerAddress}</p>
              <ul>
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.name} · {item.quantity} {item.unit} · ₹{item.amount.toFixed(2)}
                  </li>
                ))}
              </ul>
              <p className="order-card__total">Payable on delivery: ₹{order.grossAmount.toFixed(2)}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default MyOrdersPage;
