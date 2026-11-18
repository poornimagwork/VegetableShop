import { useState } from 'react';
import { formatTotalQuantity } from '../utils/invoice';

const emptyCustomer = {
  name: '',
  phone: '',
  address: '',
};

function BillSummary({
  cartItems,
  customer,
  onCustomerChange,
  onClearCart,
  onPrintBill,
  onDownloadPdf,
  onPlaceOrder,
  placing,
  canPrint,
  loggedIn,
}) {
  const [errors, setErrors] = useState({});
  const totalItems = cartItems.length;
  const grossAmount = cartItems.reduce((sum, item) => sum + item.amount, 0);
  const totalQuantity = formatTotalQuantity(cartItems);

  const validateCustomer = (requireAddress = false) => {
    const nextErrors = {};
    const name = customer.name.trim();
    const phone = customer.phone.trim();

    if (!name) {
      nextErrors.name = 'Customer name is required';
    }

    if (!phone) {
      nextErrors.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(phone)) {
      nextErrors.phone = 'Enter a valid 10-digit Indian mobile number';
    }

    if (requireAddress && customer.address.trim().length < 5) {
      nextErrors.address = 'Delivery address is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleFieldChange = (field) => (event) => {
    onCustomerChange({
      ...customer,
      [field]: event.target.value,
    });
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handlePrint = () => {
    if (cartItems.length > 0 && !validateCustomer()) {
      return;
    }
    onPrintBill();
  };

  const handleDownloadPdf = () => {
    if (cartItems.length > 0 && !validateCustomer()) {
      return;
    }
    onDownloadPdf();
  };

  const handlePlaceOrder = () => {
    if (!validateCustomer(true)) {
      return;
    }
    onPlaceOrder();
  };

  return (
    <section className="bill-summary" aria-labelledby="bill-heading">
      <div className="section-heading">
        <h2 id="bill-heading">Payment Summary</h2>
        <p>Enter customer details and finalize the bill.</p>
      </div>

      <div className="bill-card">
        <fieldset className="customer-form no-print">
          <legend>Customer Information</legend>

          <label htmlFor="customer-name">
            Customer Name <span aria-hidden="true">*</span>
          </label>
          <input
            id="customer-name"
            type="text"
            placeholder="Full name"
            value={customer.name}
            onChange={handleFieldChange('name')}
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name ? <p className="field-error">{errors.name}</p> : null}

          <label htmlFor="customer-phone">
            Phone Number <span aria-hidden="true">*</span>
          </label>
          <input
            id="customer-phone"
            type="tel"
            inputMode="numeric"
            placeholder="10-digit mobile number"
            value={customer.phone}
            onChange={handleFieldChange('phone')}
            autoComplete="tel"
            maxLength={10}
            aria-invalid={Boolean(errors.phone)}
          />
          {errors.phone ? <p className="field-error">{errors.phone}</p> : null}

          <label htmlFor="customer-address">
            Delivery address <span aria-hidden="true">*</span>
          </label>
          <textarea
            id="customer-address"
            rows={2}
            placeholder="Address for cash-on-delivery"
            value={customer.address}
            onChange={handleFieldChange('address')}
            autoComplete="street-address"
            aria-invalid={Boolean(errors.address)}
          />
          {errors.address ? (
            <p className="field-error">{errors.address}</p>
          ) : null}
        </fieldset>

        <div className="bill-meta">
          <div className="bill-meta__row">
            <span>Total vegetable items</span>
            <strong>{totalItems}</strong>
          </div>
          <div className="bill-meta__row">
            <span>Total quantity purchased</span>
            <strong>{totalQuantity}</strong>
          </div>
        </div>

        <div className="gross-amount" aria-live="polite">
          <span>GROSS AMOUNT PAYABLE</span>
          <strong>₹{grossAmount.toFixed(2)}</strong>
        </div>

        <div className="bill-actions no-print">
          <button
            type="button"
            className="btn btn-print place-order"
            onClick={handlePlaceOrder}
            disabled={cartItems.length === 0 || placing}
          >
            {placing
              ? 'Placing order…'
              : loggedIn
                ? 'Place COD Order'
                : 'Log in to place order'}
          </button>
          <button
            type="button"
            className="btn btn-print"
            onClick={handlePrint}
            disabled={!canPrint}
          >
            Print Bill
          </button>
          <button
            type="button"
            className="btn btn-pdf"
            onClick={handleDownloadPdf}
            disabled={!canPrint}
          >
            Download PDF
          </button>
          <button
            type="button"
            className="btn btn-clear"
            onClick={() => {
              onClearCart();
              onCustomerChange({ ...emptyCustomer });
              setErrors({});
            }}
            disabled={cartItems.length === 0}
          >
            Clear Cart
          </button>
        </div>
      </div>
    </section>
  );
}

export { emptyCustomer };
export default BillSummary;
