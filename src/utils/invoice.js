import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function formatQuantity(item) {
  if (item.unit === 'bunch') {
    const count = item.quantity;
    return `${count} bunch${count === 1 ? '' : 'es'}`;
  }

  if (item.quantity < 1) {
    return `${Math.round(item.quantity * 1000)} g`;
  }

  return `${Number(item.quantity.toFixed(3))} kg`;
}

export function formatTotalQuantity(cartItems) {
  const kgItems = cartItems.filter((item) => item.unit === 'kg');
  const bunchItems = cartItems.filter((item) => item.unit === 'bunch');

  const totalKg = kgItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalBunches = bunchItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  const parts = [];

  if (totalKg > 0) {
    parts.push(`${Number(totalKg.toFixed(3))} kg`);
  }

  if (totalBunches > 0) {
    parts.push(`${totalBunches} bunch${totalBunches === 1 ? '' : 'es'}`);
  }

  return parts.length > 0 ? parts.join(' + ') : '0';
}

export function createInvoiceNumber() {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
  ].join('');

  return `GB-${stamp}`;
}

export function formatInvoiceDate(date = new Date()) {
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function downloadInvoicePdf({
  cartItems,
  customer,
  invoiceNumber,
  invoiceDate,
}) {
  const doc = new jsPDF();
  const grossAmount = cartItems.reduce((sum, item) => sum + item.amount, 0);
  const totalQuantity = formatTotalQuantity(cartItems);

  doc.setFillColor(21, 128, 61);
  doc.rect(0, 0, 210, 36, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('GreenBasket', 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('Vegetable Shop Invoice', 14, 24);
  doc.setFontSize(9);
  doc.text('Bangalore market rates', 14, 31);

  doc.setTextColor(18, 48, 31);
  doc.setFontSize(10);
  doc.text(`Invoice No: ${invoiceNumber}`, 14, 46);
  doc.text(`Date: ${invoiceDate}`, 14, 52);

  doc.setFont('helvetica', 'bold');
  doc.text('Bill To', 14, 64);
  doc.setFont('helvetica', 'normal');

  const customerLines = [
    customer.name?.trim() || 'Walk-in Customer',
    customer.phone?.trim() ? `Phone: ${customer.phone.trim()}` : null,
    customer.address?.trim() ? `Address: ${customer.address.trim()}` : null,
  ].filter(Boolean);

  let y = 70;
  customerLines.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, 180);
    doc.text(wrapped, 14, y);
    y += wrapped.length * 5.5;
  });

  autoTable(doc, {
    startY: y + 4,
    head: [['Sl.', 'Vegetable', 'Price', 'Qty', 'Amount (₹)']],
    body: cartItems.map((item, index) => [
      String(index + 1),
      item.name,
      `Rs ${item.price}/${item.unit}`,
      formatQuantity(item),
      item.amount.toFixed(2),
    ]),
    styles: {
      fontSize: 9,
      cellPadding: 3,
      textColor: [18, 48, 31],
    },
    headStyles: {
      fillColor: [21, 128, 61],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 14 },
      4: { halign: 'right' },
    },
  });

  const summaryY = (doc.lastAutoTable?.finalY || y) + 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Total items: ${cartItems.length}`, 14, summaryY);
  doc.text(`Total quantity: ${totalQuantity}`, 14, summaryY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(
    `Gross Amount Payable: Rs ${grossAmount.toFixed(2)}`,
    14,
    summaryY + 18,
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(75, 107, 87);
  doc.text('Thank you for shopping with GreenBasket!', 14, summaryY + 28);
  doc.text('Fresh produce · Fair Bangalore market prices', 14, summaryY + 34);

  doc.save(`${invoiceNumber}.pdf`);
}
