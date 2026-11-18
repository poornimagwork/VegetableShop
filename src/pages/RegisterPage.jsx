import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  address: '',
};

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (field) => (event) => {
    setForm({ ...form, [field]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      await register(form);
      navigate('/');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-layout no-print">
      <section className="bill-summary">
        <div className="section-heading">
          <h2>Create account</h2>
          <p>Register once, then order fresh vegetables for delivery.</p>
        </div>
        <form className="customer-form" onSubmit={handleSubmit}>
          <label htmlFor="register-name">Full name</label>
          <input id="register-name" value={form.name} onChange={update('name')} required />
          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={update('email')}
            required
          />
          <label htmlFor="register-phone">Phone</label>
          <input
            id="register-phone"
            inputMode="numeric"
            maxLength={10}
            value={form.phone}
            onChange={update('phone')}
            required
          />
          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={update('password')}
            required
          />
          <label htmlFor="register-address">Delivery address</label>
          <textarea
            id="register-address"
            rows={2}
            value={form.address}
            onChange={update('address')}
          />
          {error ? <p className="field-error">{error}</p> : null}
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Creating account…' : 'Register'}
          </button>
        </form>
        <p className="form-switch">
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}

export default RegisterPage;
