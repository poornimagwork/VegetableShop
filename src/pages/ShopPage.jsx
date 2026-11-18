import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import BillSummary, { emptyCustomer } from '../components/BillSummary';
import InvoiceSheet from '../components/InvoiceSheet';
import ShoppingCart from '../components/ShoppingCart';
import VegetableList from '../components/VegetableList';
import { downloadInvoicePdf, formatInvoiceDate } from '../utils/invoice';

const getStep = (item) => (item.unit === 'bunch' ? 1 : 0.25);

function readStoredCart() {
  try {
    const stored = JSON.parse(sessionStorage.getItem('gb_cart') || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function lineAmount(quantity, price) {
  return Number((quantity * price).toFixed(2));
}

function ShopPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vegetables, setVegetables] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name');
  const [order, setOrder] = useState('asc');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [cartItems, setCartItems] = useState(readStoredCart);
  const [customer, setCustomer] = useState(emptyCustomer);
  const [receipt, setReceipt] = useState(null);
  const [invoiceView, setInvoiceView] = useState(null);
  const [shouldPrint, setShouldPrint] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      search,
      sort,
      order,
      page: String(page),
      pageSize: '8',
    });

    setLoading(true);
    api(`/vegetables?${params}`, { signal: controller.signal })
      .then((data) => {
        setVegetables(data.vegetables);
        setTotal(data.total);
        setLoadError('');
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setLoadError(error.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [search, sort, order, page, reloadKey]);

  useEffect(() => {
    sessionStorage.setItem('gb_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    setCartItems((current) =>
      current.map((item) => {
        const fresh = vegetables.find((vegetable) => vegetable.id === item.id);
        if (!fresh) {
          return item;
        }

        return {
          ...item,
          name: fresh.name,
          price: fresh.price,
          unit: fresh.unit,
          image: fresh.image,
          stockQty: fresh.stockQty,
          amount: lineAmount(item.quantity, fresh.price),
        };
      }),
    );
  }, [vegetables]);

  useEffect(() => {
    if (!user) {
      return;
    }

    setCustomer((current) => ({
      name: current.name || user.name,
      phone: current.phone || user.phone,
      address: current.address || user.address || '',
    }));
  }, [user]);

  useEffect(() => {
    if (!shouldPrint) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      window.print();
      setShouldPrint(false);
    }, 50);

    return () => window.clearTimeout(timer);
  }, [shouldPrint, invoiceView]);

  const addToCart = (vegetable, quantityInBase) => {
    let message = '';

    setCartItems((current) => {
      const existing = current.find((item) => item.id === vegetable.id);
      const nextQuantity = Number(
        ((existing?.quantity || 0) + quantityInBase).toFixed(3),
      );

      if (nextQuantity > vegetable.stockQty) {
        message = `Only ${vegetable.stockQty} ${vegetable.unit} of ${vegetable.name} is in stock`;
        return current;
      }

      if (existing) {
        return current.map((item) =>
          item.id === vegetable.id
            ? {
                ...item,
                quantity: nextQuantity,
                amount: lineAmount(nextQuantity, item.price),
              }
            : item,
        );
      }

      return [
        ...current,
        {
          id: vegetable.id,
          name: vegetable.name,
          price: vegetable.price,
          unit: vegetable.unit,
          image: vegetable.image,
          stockQty: vegetable.stockQty,
          quantity: quantityInBase,
          amount: lineAmount(quantityInBase, vegetable.price),
        },
      ];
    });

    if (message) {
      setNotice({ type: 'error', text: message });
    }

    return message;
  };

  const increaseQuantity = (id) => {
    setCartItems((current) =>
      current.map((item) => {
        if (item.id !== id) {
          return item;
        }

        const quantity = Number((item.quantity + getStep(item)).toFixed(3));
        if (quantity > item.stockQty) {
          setNotice({
            type: 'error',
            text: `Only ${item.stockQty} ${item.unit} of ${item.name} is in stock`,
          });
          return item;
        }

        return { ...item, quantity, amount: lineAmount(quantity, item.price) };
      }),
    );
  };

  const decreaseQuantity = (id) => {
    setCartItems((current) =>
      current
        .map((item) => {
          if (item.id !== id) {
            return item;
          }

          const quantity = Number((item.quantity - getStep(item)).toFixed(3));
          if (quantity <= 0) {
            return null;
          }

          return { ...item, quantity, amount: lineAmount(quantity, item.price) };
        })
        .filter(Boolean),
    );
  };

  const removeFromCart = (id) => {
    setCartItems((current) => current.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
    setReceipt(null);
  };

  const documentForOutput = () => {
    if (cartItems.length > 0) {
      return {
        cartItems,
        customer,
        invoiceNumber: 'DRAFT',
        invoiceDate: formatInvoiceDate(),
      };
    }

    return receipt;
  };

  const printBill = () => {
    const document = documentForOutput();
    if (!document) {
      return;
    }
    setInvoiceView(document);
    setShouldPrint(true);
  };

  const downloadPdf = () => {
    const document = documentForOutput();
    if (!document) {
      return;
    }
    downloadInvoicePdf(document);
  };

  const placeOrder = async () => {
    if (!user) {
      navigate('/login?next=/');
      return;
    }

    if (user.role !== 'customer') {
      setNotice({
        type: 'error',
        text: 'Log in with a customer account to place an order. Admin accounts manage the shop.',
      });
      return;
    }

    setPlacing(true);
    setNotice(null);

    try {
      const data = await api('/orders', {
        method: 'POST',
        body: {
          customerName: customer.name,
          phone: customer.phone,
          address: customer.address,
          items: cartItems.map((item) => ({
            vegetableId: item.id,
            quantity: item.quantity,
          })),
        },
      });
      const nextReceipt = {
        cartItems: data.order.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          unit: item.unit,
          quantity: item.quantity,
          amount: item.amount,
        })),
        customer: {
          name: data.order.customerName,
          phone: data.order.customerPhone,
          address: data.order.customerAddress,
        },
        invoiceNumber: data.order.invoiceNumber,
        invoiceDate: formatInvoiceDate(new Date(data.order.createdAt)),
      };
      setReceipt(nextReceipt);
      setCartItems([]);
      setNotice({
        type: 'success',
        text: `Order ${data.order.invoiceNumber} placed. Pay ₹${data.order.grossAmount.toFixed(2)} on delivery.`,
      });
      setReloadKey((value) => value + 1);
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    } finally {
      setPlacing(false);
    }
  };

  return (
    <>
      <main className="shop-main no-print">
        <VegetableList
          vegetables={vegetables}
          loading={loading}
          error={loadError}
          search={searchInput}
          sort={sort}
          order={order}
          page={page}
          pageSize={8}
          total={total}
          onSearch={(value) => {
            setSearchInput(value);
            setPage(1);
          }}
          onSort={(nextSort, nextOrder) => {
            setSort(nextSort);
            setOrder(nextOrder);
            setPage(1);
          }}
          onPage={setPage}
          onAddToCart={addToCart}
        />

        <aside className="billing-column">
          {notice ? (
            <p className={`notice notice-${notice.type}`} role="status">
              {notice.text}
            </p>
          ) : null}
          <ShoppingCart
            cartItems={cartItems}
            onIncrease={increaseQuantity}
            onDecrease={decreaseQuantity}
            onRemove={removeFromCart}
          />
          <BillSummary
            cartItems={cartItems}
            customer={customer}
            onCustomerChange={setCustomer}
            onClearCart={clearCart}
            onPrintBill={printBill}
            onDownloadPdf={downloadPdf}
            onPlaceOrder={placeOrder}
            placing={placing}
            canPrint={cartItems.length > 0 || Boolean(receipt)}
            loggedIn={Boolean(user)}
          />
        </aside>
      </main>

      {invoiceView ? (
        <InvoiceSheet
          cartItems={invoiceView.cartItems}
          customer={invoiceView.customer}
          invoiceNumber={invoiceView.invoiceNumber}
          invoiceDate={invoiceView.invoiceDate}
        />
      ) : null}
    </>
  );
}

export default ShopPage;
