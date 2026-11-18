import { useState } from 'react';

function VegetableCard({ vegetable, onAddToCart }) {
  const isBunch = vegetable.unit === 'bunch';
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState(isBunch ? 'bunch' : 'kg');
  const [error, setError] = useState('');

  const handleAdd = () => {
    const value = Number(quantity);

    if (quantity === '' || Number.isNaN(value)) {
      setError('Enter a valid quantity');
      return;
    }

    if (value <= 0) {
      setError('Quantity must be greater than zero');
      return;
    }

    if (unit === 'g' && value < 1) {
      setError('Enter at least 1 gram');
      return;
    }

    const quantityInBase =
      unit === 'g' ? Number((value / 1000).toFixed(3)) : value;

    if (
      vegetable.stockQty != null &&
      quantityInBase > Number(vegetable.stockQty)
    ) {
      setError(
        `Only ${vegetable.stockQty} ${vegetable.unit} is in stock`,
      );
      return;
    }

    const message = onAddToCart(vegetable, quantityInBase);
    if (message) {
      setError(message);
      return;
    }
    setQuantity('');
    setError('');
    setUnit(isBunch ? 'bunch' : 'kg');
  };

  const handleQuantityChange = (event) => {
    const next = event.target.value;
    if (next === '' || /^\d*\.?\d*$/.test(next)) {
      setQuantity(next);
      setError('');
    }
  };

  return (
    <article className="vegetable-card">
      <div className="vegetable-card__media">
        <img src={vegetable.image} alt={vegetable.name} loading="lazy" />
      </div>

      <div className="vegetable-card__body">
        <h3 className="vegetable-card__name">{vegetable.name}</h3>
        <p className="vegetable-card__desc">{vegetable.description}</p>
        <p className="vegetable-card__price">
          ₹{vegetable.price}
          <span>/{vegetable.unit}</span>
        </p>
        {vegetable.stockQty != null ? (
          <p className="vegetable-card__stock">
            In stock: {vegetable.stockQty} {vegetable.unit}
          </p>
        ) : null}

        <div className="vegetable-card__controls">
          <label className="sr-only" htmlFor={`qty-${vegetable.id}`}>
            Quantity for {vegetable.name}
          </label>
          <input
            id={`qty-${vegetable.id}`}
            type="text"
            inputMode="decimal"
            placeholder="Qty"
            value={quantity}
            onChange={handleQuantityChange}
            aria-invalid={Boolean(error)}
          />

          {isBunch ? (
            <span className="unit-badge">bunch</span>
          ) : (
            <select
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
              aria-label={`Unit for ${vegetable.name}`}
            >
              <option value="kg">kg</option>
              <option value="g">g</option>
            </select>
          )}
        </div>

        {error ? <p className="field-error">{error}</p> : null}

        <button type="button" className="btn btn-primary" onClick={handleAdd}>
          Add to Cart
        </button>
      </div>
    </article>
  );
}

export default VegetableCard;
