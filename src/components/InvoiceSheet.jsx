import {
  formatInvoiceDate,
  formatQuantity,
  formatTotalQuantity,
} from '../utils/invoice';

function InvoiceSheet({ cartItems, customer, invoiceNumber, invoiceDate }) {
  const grossAmount = cartItems.reduce((sum, item) => sum + item.amount, 0);
  const totalQuantity = formatTotalQuantity(cartItems);
  const displayDate = invoiceDate || formatInvoiceDate();

  return (
    <section className="invoice-sheet" aria-label="Printable invoice">
      <header className="invoice-sheet__header">
        <div>
          <p className="invoice-sheet__brand">GreenBasket</p>
          <h1>Vegetable Shop Invoice</h1>
          <p className="invoice-sheet__sub">Bangalore market rates</p>
        </div>
        <div className="invoice-sheet__meta">
          <p>
            <strong>Invoice No:</strong> {invoiceNumber}
          </p>
          <p>
            <strong>Date:</strong> {displayDate}
          </p>
        </div>
      </header>

      <div className="invoice-sheet__customer">
        <h2>Bill To</h2>
        <p>
          <strong>{customer.name?.trim() || 'Walk-in Customer'}</strong>
        </p>
        {customer.phone?.trim() ? <p>Phone: {customer.phone.trim()}</p> : null}
        {customer.address?.trim() ? (
          <p>Address: {customer.address.trim()}</p>
        ) : null}
      </div>

      <table className="invoice-sheet__table">
        <thead>
          <tr>
            <th scope="col">Sl.</th>
            <th scope="col">Vegetable</th>
            <th scope="col">Price</th>
            <th scope="col">Quantity</th>
            <th scope="col">Amount</th>
          </tr>
        </thead>
        <tbody>
          {cartItems.map((item, index) => (
            <tr key={item.id}>
              <td>{index + 1}</td>
              <td>{item.name}</td>
              <td>
                ₹{item.price}/{item.unit}
              </td>
              <td>{formatQuantity(item)}</td>
              <td>₹{item.amount.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="invoice-sheet__summary">
        <p>
          <span>Total items</span>
          <strong>{cartItems.length}</strong>
        </p>
        <p>
          <span>Total quantity</span>
          <strong>{totalQuantity}</strong>
        </p>
        <p className="invoice-sheet__total">
          <span>Gross Amount Payable</span>
          <strong>₹{grossAmount.toFixed(2)}</strong>
        </p>
      </div>

      <footer className="invoice-sheet__footer">
        <p>Thank you for shopping with GreenBasket!</p>
        <p>Fresh produce · Fair Bangalore market prices</p>
      </footer>
    </section>
  );
}

export default InvoiceSheet;
