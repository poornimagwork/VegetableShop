import { useEffect, useState } from 'react';
import { api } from '../api/client';

const emptyForm = {
  id: null,
  name: '',
  description: '',
  price: '',
  unit: 'kg',
  image: '/vegetables/tomato.jpg',
  stockQty: '',
  isActive: true,
};

function AdminVegetablesPage() {
  const [form, setForm] = useState(emptyForm);
  const [rows, setRows] = useState([]);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    return api('/admin/vegetables?page=1&pageSize=24&sort=name&order=asc')
      .then((data) => setRows(data.vegetables))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    api('/admin/vegetables?page=1&pageSize=24&sort=name&order=asc')
      .then((data) => {
        if (active) {
          setRows(data.vegetables);
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

  const update = (field) => (event) => {
    const value = field === 'isActive' ? event.target.checked : event.target.value;
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    setError('');

    const payload = {
      ...form,
      price: Number(form.price),
      stockQty: Number(form.stockQty),
    };

    try {
      if (form.id) {
        await api(`/admin/vegetables/${form.id}`, { method: 'PUT', body: payload });
        setNotice({ type: 'success', text: `${form.name} was updated.` });
      } else {
        await api('/admin/vegetables', { method: 'POST', body: payload });
        setNotice({ type: 'success', text: `${form.name} was added to the shop.` });
      }
      setForm(emptyForm);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (vegetable) => {
    const next = !vegetable.isActive;
    const verb = next ? 'show' : 'hide';
    if (!window.confirm(`${verb[0].toUpperCase()}${verb.slice(1)} ${vegetable.name} in the shop?`)) {
      return;
    }

    try {
      await api(`/admin/vegetables/${vegetable.id}/active`, {
        method: 'PATCH',
        body: { isActive: next },
      });
      setNotice({
        type: 'success',
        text: next
          ? `${vegetable.name} is visible to customers.`
          : `${vegetable.name} is hidden from the shop.`,
      });
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <main className="page-panel no-print">
      <section className="cart-panel">
        <div className="section-heading">
          <h2>{form.id ? 'Edit vegetable' : 'Add vegetable'}</h2>
          <p>Prices, stock, and photos shown in the customer catalogue.</p>
        </div>
        {notice ? (
          <p className={`notice notice-${notice.type}`} role="status">
            {notice.text}
          </p>
        ) : null}
        {error ? (
          <p className="notice notice-error" role="alert">
            {error}
          </p>
        ) : null}
        <form className="customer-form" onSubmit={handleSubmit}>
          <label htmlFor="veg-name">Name</label>
          <input id="veg-name" value={form.name} onChange={update('name')} required />
          <label htmlFor="veg-description">Description</label>
          <input
            id="veg-description"
            value={form.description}
            onChange={update('description')}
            required
          />
          <div className="form-row">
            <div>
              <label htmlFor="veg-price">Price (₹)</label>
              <input
                id="veg-price"
                inputMode="decimal"
                value={form.price}
                onChange={update('price')}
                required
              />
            </div>
            <div>
              <label htmlFor="veg-unit">Unit</label>
              <select id="veg-unit" value={form.unit} onChange={update('unit')}>
                <option value="kg">kg</option>
                <option value="bunch">bunch</option>
              </select>
            </div>
            <div>
              <label htmlFor="veg-stock">Stock</label>
              <input
                id="veg-stock"
                inputMode="decimal"
                value={form.stockQty}
                onChange={update('stockQty')}
                required
              />
            </div>
          </div>
          <label htmlFor="veg-image">Image path</label>
          <input id="veg-image" value={form.image} onChange={update('image')} required />
          <label className="check-line" htmlFor="veg-active">
            <input
              id="veg-active"
              type="checkbox"
              checked={form.isActive}
              onChange={update('isActive')}
            />
            Visible in the shop
          </label>
          <div className="bill-actions">
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving…' : form.id ? 'Save changes' : 'Add vegetable'}
            </button>
            {form.id ? (
              <button
                className="btn btn-clear"
                type="button"
                onClick={() => setForm(emptyForm)}
              >
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="cart-panel">
        <div className="section-heading">
          <h2>Catalogue</h2>
          <p>Changes appear in the shop as soon as you save.</p>
        </div>
        {loading ? <p className="status-line">Loading vegetables…</p> : null}
        <div className="cart-table-wrap">
          <table className="cart-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((vegetable) => (
                <tr key={vegetable.id}>
                  <td>{vegetable.name}</td>
                  <td>
                    ₹{vegetable.price}/{vegetable.unit}
                  </td>
                  <td>{vegetable.stockQty}</td>
                  <td>{vegetable.isActive ? 'Visible' : 'Hidden'}</td>
                  <td className="table-actions">
                    <button
                      type="button"
                      className="btn btn-clear"
                      onClick={() =>
                        setForm({
                          id: vegetable.id,
                          name: vegetable.name,
                          description: vegetable.description,
                          price: String(vegetable.price),
                          unit: vegetable.unit,
                          image: vegetable.image,
                          stockQty: String(vegetable.stockQty),
                          isActive: vegetable.isActive,
                        })
                      }
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => toggleActive(vegetable)}
                    >
                      {vegetable.isActive ? 'Hide' : 'Show'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default AdminVegetablesPage;
