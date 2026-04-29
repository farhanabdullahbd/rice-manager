import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';
import useAuthStore from '../store/authStore';

function Invoice({ sale, forwardRef }) {
  if (!sale) return null;
  return (
    <div ref={forwardRef} className="p-6 text-sm" style={{ fontFamily: 'monospace' }}>
      <h2 className="text-xl font-bold text-center text-black">🛒 POS সিস্টেম</h2>
      <p className="text-center text-gray-500 text-xs">{sale.branch?.name}</p>
      <hr className="my-2" />
      <div className="flex justify-between text-xs text-black">
        <span>ইনভয়েস: {sale.invoiceNo}</span>
        <span>{new Date(sale.createdAt).toLocaleString('bn-BD')}</span>
      </div>
      {sale.customer && <p className="text-xs mt-1 text-black">কাস্টমার: {sale.customer.name}</p>}
      <hr className="my-2" />
      <table className="w-full text-xs text-black">
        <thead>
          <tr className="border-b font-bold">
            <th className="text-left pb-1">পণ্য</th>
            <th className="text-right pb-1">পরিমাণ</th>
            <th className="text-right pb-1">মূল্য</th>
            <th className="text-right pb-1">মোট</th>
          </tr>
        </thead>
        <tbody>
          {sale.items?.map((item, i) => (
            <tr key={i} className="border-b last:border-0">
              <td className="py-1">{item.product?.name}</td>
              <td className="py-1 text-right">{Number(item.quantity)} {item.product?.unit}</td>
              <td className="py-1 text-right">৳{Number(item.unitPrice)}</td>
              <td className="py-1 text-right">৳{Number(item.totalPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <hr className="my-2" />
      <div className="text-xs text-black space-y-0.5">
        <div className="flex justify-between"><span>সাবটোটাল:</span><span>৳{Number(sale.subtotal)}</span></div>
        {Number(sale.discount) > 0 && <div className="flex justify-between"><span>ছাড়:</span><span>-৳{Number(sale.discount)}</span></div>}
        <div className="flex justify-between font-bold text-base"><span>মোট:</span><span>৳{Number(sale.totalAmount)}</span></div>
        <div className="flex justify-between"><span>পরিশোধ:</span><span>৳{Number(sale.paidAmount)}</span></div>
        {Number(sale.dueAmount) > 0 && <div className="flex justify-between font-bold text-red-600"><span>বাকি:</span><span>৳{Number(sale.dueAmount)}</span></div>}
      </div>
      <p className="text-center text-xs text-gray-400 mt-4 text-black">ধন্যবাদ! আবার আসবেন ✦</p>
    </div>
  );
}

function QRScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('qr-scanner', {
      fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true,
    });
    scanner.render(
      (text) => { onScan(text); scanner.clear(); onClose(); },
      (err) => {}
    );
    scannerRef.current = scanner;
    return () => { scanner.clear().catch(() => {}); };
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.9)' }}>
      <div className="rounded-2xl p-6 w-full max-w-sm"
        style={{ background: 'linear-gradient(135deg, #2d0009, #1a0005)', border: '1px solid #d4af37' }}>
        <h3 className="font-bold text-lg mb-4 text-center" style={{ color: '#d4af37' }}>📱 QR কোড স্ক্যান</h3>
        <div id="qr-scanner" className="rounded-xl overflow-hidden" />
        <button onClick={onClose} className="btn btn-outline w-full justify-center mt-4">বাতিল</button>
      </div>
    </div>
  );
}

export default function POS() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [lastSale, setLastSale] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const invoiceRef = useRef();

  useEffect(() => {
    api.get('/products').then((r) => setProducts(r.data));
    api.get('/customers').then((r) => setCustomers(r.data));
  }, []);

  const handlePrint = useReactToPrint({ content: () => invoiceRef.current });

  const handleQRScan = (text) => {
    try {
      const data = JSON.parse(text);
      const product = products.find((p) => p.id === data.id || p.sku === data.sku);
      if (product) { addToCart(product); toast.success(`${product.name} যোগ হয়েছে`); }
      else toast.error('পণ্য পাওয়া যায়নি');
    } catch { toast.error('QR কোড সঠিক নয়'); }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.includes(search)
  );

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) return prev.map((i) =>
        i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
      );
      return [...prev, {
        productId: product.id, name: product.name, unit: product.unit,
        unitPrice: Number(product.sellingPrice), quantity: 1, discount: 0,
      }];
    });
  };

  const updateCartItem = (idx, field, value) =>
    setCart((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: parseFloat(value) || 0 } : item));

  const removeFromCart = (idx) => setCart((prev) => prev.filter((_, i) => i !== idx));

  const subtotal = cart.reduce((sum, i) => sum + i.quantity * i.unitPrice - i.discount, 0);
  const total = subtotal - parseFloat(discount || 0);
  const paid = paidAmount === '' ? total : parseFloat(paidAmount);
  const due = Math.max(0, total - paid);
  const change = Math.max(0, paid - total);

  const handleSell = async () => {
    if (cart.length === 0) return toast.error('কার্টে পণ্য যোগ করুন');
    setLoading(true);
    try {
      const { data } = await api.post('/sales', {
        customerId: customerId || null,
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, discount: i.discount })),
        discount: parseFloat(discount || 0), paidAmount: paid, paymentMethod,
      });
      const full = await api.get(`/sales/${data.id}`);
      setLastSale(full.data);
      toast.success('✅ বিক্রয় সম্পন্ন!');
      setCart([]); setDiscount(0); setPaidAmount(''); setCustomerId('');
      setTimeout(() => handlePrint(), 300);
    } catch (err) {
      toast.error(err.response?.data?.message || 'বিক্রয় ব্যর্থ');
    } finally { setLoading(false); }
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-48px)]">
      {/* Product panel */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <div className="flex gap-2">
          <input className="input flex-1" placeholder="🔍 পণ্য খুঁজুন (নাম / SKU)..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
          <button onClick={() => setShowScanner(true)} className="btn btn-gold shrink-0" title="QR স্ক্যান করুন">
            📱 QR স্ক্যান
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto flex-1 pr-1">
          {filtered.map((p) => (
            <button key={p.id} onClick={() => addToCart(p)}
              className="text-left p-3 rounded-xl transition-all cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #2d0009, #1a0005)',
                border: '1px solid #4a0012',
              }}
              onMouseOver={e => e.currentTarget.style.borderColor = '#d4af37'}
              onMouseOut={e => e.currentTarget.style.borderColor = '#4a0012'}>
              <p className="font-medium text-sm truncate" style={{ color: '#f5e6e0' }}>{p.name}</p>
              <p className="text-xs mt-0.5" style={{ color: '#c9a0a0' }}>{p.sku} · {p.unit}</p>
              <p className="font-bold mt-2 text-base" style={{ color: '#d4af37' }}>৳{Number(p.sellingPrice)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Cart panel */}
      <div className="w-80 flex flex-col gap-3 shrink-0">
        <div className="card flex-1 flex flex-col overflow-hidden">
          <h3 className="font-bold mb-3" style={{ color: '#d4af37' }}>🛒 কার্ট</h3>
          <select className="input mb-3 text-sm" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">-- কাস্টমার (ঐচ্ছিক) --</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
          </select>

          <div className="flex-1 overflow-y-auto space-y-2">
            {cart.length === 0 && (
              <div className="text-center py-8">
                <p className="text-4xl mb-2">🛒</p>
                <p className="text-sm" style={{ color: '#c9a0a0' }}>কার্ট খালি</p>
              </div>
            )}
            {cart.map((item, idx) => (
              <div key={idx} className="p-2.5 rounded-lg" style={{ background: '#1a0005', border: '1px solid #4a0012' }}>
                <div className="flex justify-between items-start mb-1.5">
                  <span className="text-xs font-medium" style={{ color: '#f5e6e0' }}>{item.name}</span>
                  <button onClick={() => removeFromCart(idx)} style={{ color: '#f87171' }} className="text-xs hover:opacity-70">✕</button>
                </div>
                <div className="flex gap-1.5">
                  <input type="number" min="0.1" step="0.1" value={item.quantity}
                    onChange={(e) => updateCartItem(idx, 'quantity', e.target.value)}
                    className="input w-16 text-xs py-1" />
                  <input type="number" min="0" value={item.unitPrice}
                    onChange={(e) => updateCartItem(idx, 'unitPrice', e.target.value)}
                    className="input flex-1 text-xs py-1" />
                </div>
                <div className="flex justify-between items-center mt-1.5">
                  <span className="text-xs" style={{ color: '#c9a0a0' }}>
                    ছাড়: <input type="number" min="0" value={item.discount}
                      onChange={(e) => updateCartItem(idx, 'discount', e.target.value)}
                      className="w-12 text-xs text-center rounded px-1 py-0.5 ml-1"
                      style={{ background: '#2d0009', border: '1px solid #4a0012', color: '#f5e6e0' }} />
                  </span>
                  <span className="font-bold text-sm" style={{ color: '#d4af37' }}>
                    ৳{(item.quantity * item.unitPrice - item.discount).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment */}
        <div className="card space-y-2.5 text-sm shrink-0">
          <div className="flex justify-between text-xs" style={{ color: '#c9a0a0' }}>
            <span>সাবটোটাল:</span><span>৳{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs shrink-0" style={{ color: '#c9a0a0' }}>ছাড় (৳):</span>
            <input type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} className="input py-1 text-xs" />
          </div>
          <div className="flex justify-between font-bold text-base pt-1" style={{ borderTop: '1px solid #4a0012' }}>
            <span style={{ color: '#f5e6e0' }}>মোট:</span>
            <span style={{ color: '#d4af37' }}>৳{total.toFixed(2)}</span>
          </div>
          <select className="input text-sm" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="cash">💵 নগদ</option>
            <option value="bkash">📱 বিকাশ</option>
            <option value="nagad">📱 নগদ মোবাইল</option>
            <option value="card">💳 কার্ড</option>
            <option value="credit">📒 বাকি</option>
          </select>
          <input type="number" min="0" placeholder={`পরিশোধ (৳${total.toFixed(2)})`}
            value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} className="input text-sm" />
          {change > 0 && <p className="text-xs font-medium" style={{ color: '#4ade80' }}>ফেরত: ৳{change.toFixed(2)}</p>}
          {due > 0 && <p className="text-xs font-medium" style={{ color: '#f87171' }}>বাকি: ৳{due.toFixed(2)}</p>}

          <button onClick={handleSell} disabled={loading || cart.length === 0}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all shadow-lg"
            style={{
              background: loading || cart.length === 0 ? '#2d0009' : 'linear-gradient(135deg, #d4af37, #b8962e)',
              color: loading || cart.length === 0 ? '#c9a0a0' : '#1a0005',
              border: '1px solid #d4af37'
            }}>
            {loading ? '⏳ প্রক্রিয়া হচ্ছে...' : '✅ বিক্রয় সম্পন্ন করুন'}
          </button>
          {lastSale && (
            <button onClick={handlePrint} className="btn btn-outline w-full justify-center text-xs">
              🖨️ রশিদ প্রিন্ট
            </button>
          )}
        </div>
      </div>

      {/* Hidden invoice */}
      <div className="hidden"><Invoice sale={lastSale} forwardRef={invoiceRef} /></div>

      {/* QR Scanner */}
      {showScanner && <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />}
    </div>
  );
}
