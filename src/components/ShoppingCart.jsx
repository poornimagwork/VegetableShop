import { formatQuantity } from '../utils/invoice';

function ShoppingCart({ cartItems, onIncrease, onDecrease, onRemove }) {
  if (cartItems.length === 0) {
    return (
      <section className="cart-panel" aria-labelledby="cart-heading">
        <div className="section-heading">
          <h2 id="cart-heading">Shopping Cart</h2>
          <p>Your selected vegetables will appear here.</p>
        </div>
        <div className="empty-cart">
          <p>Cart is empty. Add vegetables from the catalogue.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="cart-panel" aria-labelledby="cart-heading">
      <div className="section-heading">
        <h2 id="cart-heading">Shopping Cart</h2>
        <p>Review quantities and item amounts before payment.</p>
      </div>

      <div className="cart-table-wrap">
        <table className="cart-table">
          <thead>
            <tr>
              <th scope="col">Sl. No.</th>
              <th scope="col">Vegetable Name</th>
              <th scope="col">Price</th>
              <th scope="col">Quantity</th>
              <th scope="col">Amount</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cartItems.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>
                  <div className="cart-item-name">
                    <img src={item.image} alt="" />
                    <span>{item.name}</span>
                  </div>
                </td>
                <td>
                  ₹{item.price}/{item.unit}
                </td>
                <td>
                  <div className="qty-controls">
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => onDecrease(item.id)}
                      aria-label={`Decrease ${item.name}`}
                    >
                      −
                    </button>
                    <span className="qty-value">{formatQuantity(item)}</span>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => onIncrease(item.id)}
                      aria-label={`Increase ${item.name}`}
                    >
                      +
                    </button>
                  </div>
                </td>
                <td className="amount-cell">₹{item.amount.toFixed(2)}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => onRemove(item.id)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default ShoppingCart;
