export function mapUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    address: row.address,
  };
}

export function mapVegetable(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    unit: row.unit,
    image: row.image_url,
    stockQty: Number(row.stock_qty),
    isActive: row.is_active,
  };
}

export function mapOrderItem(item) {
  return {
    id: item.id,
    vegetableId: item.vegetableId ?? item.vegetable_id ?? null,
    name: item.name ?? item.name_snapshot,
    price: Number(item.price ?? item.price_snapshot),
    quantity: Number(item.quantity),
    unit: item.unit,
    amount: Number(item.amount),
  };
}

export function mapOrder(row) {
  const items = Array.isArray(row.items) ? row.items.map(mapOrderItem) : [];

  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    status: row.status,
    paymentMethod: row.payment_method,
    grossAmount: Number(row.gross_amount),
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerAddress: row.customer_address,
    createdAt: row.created_at,
    userId: row.user_id,
    items,
  };
}
