import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="app">
      <header className="shop-header no-print">
        <div className="shop-header__inner">
          <p className="shop-brand">GreenBasket</p>
          <h1>Vegetable Shop</h1>
          <p className="shop-tagline">
            Fresh produce at Bangalore market rates. Browse, order, and pay on
            delivery.
          </p>
          <nav className="shop-nav" aria-label="Main">
            <NavLink to="/" end>
              Shop
            </NavLink>
            {user ? (
              <NavLink to="/orders">My Orders</NavLink>
            ) : null}
            {user?.role === 'admin' ? (
              <>
                <NavLink to="/admin/vegetables">Manage Vegetables</NavLink>
                <NavLink to="/admin/orders">Manage Orders</NavLink>
              </>
            ) : null}
            {user ? (
              <button type="button" onClick={logout}>
                Log out ({user.name.split(' ')[0]})
              </button>
            ) : (
              <>
                <NavLink to="/login">Log in</NavLink>
                <NavLink to="/register">Register</NavLink>
              </>
            )}
          </nav>
        </div>
      </header>

      <Outlet />

      <footer className="shop-footer no-print">
        <p>
          GreenBasket Vegetable Shop · Prices based on Bangalore market rates ·
          Cash on delivery
        </p>
      </footer>
    </div>
  );
}

export default AppShell;
