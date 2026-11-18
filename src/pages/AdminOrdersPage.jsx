import { useEffect, useState } from 'react';
import { api } from '../api/client';

const statuses = ['pending', 'confirmed', 'delivered', 'cancelled'];

function formatWhen(value) {
  return new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const pageSize = 8;

  const load = (nextPage = page, nextFilter = filter) => {
    const params = new URLSearchParams({
      page: String(nextPage),
      pageSize: String(pageSize),
    });
    if (nextFilter) {
      params.set('status', nextFilter);
    }

    return api(`/admin/orders?${params}`)
      .then((data) => {
        setOrders(data.orders);
        setTotal(data.total);
      })
      .catch((requestError) => setError(requestError.message));
  };

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (filter) {
      params.set('status', filter);
    }

    setLoading(true);
    api(`/admin/orders?${params}`)
      .then((data) => {
        if (active) {
          setOrders(data.orders);
          setTotal(data.total);
          setError('');
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

    const timer = window.setInterval(() => {
      load(page, filter);
    }, 8000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [page, filter]);

  const changeStatus = async (order, status) => {
    if (status === 'cancelled') {
      const confirmed = window.confirm(
        `Cancel ${order.invoiceNumber}? Stock will be returned.`,
      );
      if (!confirmed) {
        return;
      }
    }

    try {
      await api(`/admin/orders/${order.id}/status`, {
        method: 'PATCH',
        body: { status },
      });
      setNotice(`${order.invoiceNumber} is now ${status}.`);
      setError('');
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const pageCount = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <main className="page-panel no-print">
      <section className="cart-panel">
        <div className="section-heading">
          <h2>Orders</h2>
          <p>This list refreshes every few seconds.</p>
        </div>
        <div className="catalogue-tools">
          <label htmlFor="order-filter">Status</label>
          <select
            id="order-filter"
            value={filter}
            onChange={(event) => {
              setPage(1);
              setFilter(event.target.value);
            }}
          >
            <option value="">All</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        {notice ? <p className="notice notice-success">{notice}</p> : null}
        {error ? <p className="notice notice-error">{error}</p> : null}
        {loading ? <p className="status-line">Loading orders…</p> : null}
        {!loading && orders.length === 0 ? (
          <div className="empty-cart">
            <p>No orders match this filter.</p>
          </div>
        ) : null}
        <div className="order-list">
          {orders.map((order) => (
            <article className="order-card" key={order.id}>
              <header>
                <strong>{order.invoiceNumber}</strong>
                <span className={`status status-${order.status}`}>{order.status}</span>
              </header>
              <p>
                {formatWhen(order.createdAt)} · {order.customerName} · {order.customerPhone}
              </p>
              <p>{order.customerAddress}</p>
              <ul>
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.name} · {item.quantity} {item.unit} · ₹{item.amount.toFixed(2)}
                  </li>
                ))}
              </ul>
              <p className="order-card__total">₹{order.grossAmount.toFixed(2)} · COD</p>
              <label htmlFor={`status-${order.id}`}>Update status</label>
              <select
                id={`status-${order.id}`}
                value={order.status}
                onChange={(event) => changeStatus(order, event.target.value)}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </article>
          ))}
        </div>
        <div className="pager">
          <button
            type="button"
            className="btn btn-clear"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            Previous
          </button>
          <span>
            Page {page} of {pageCount}
          </span>
          <button
            type="button"
            className="btn btn-clear"
            disabled={page >= pageCount}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </button>
        </div>
      </section>
    </main>
  );
}

export default AdminOrdersPage;
