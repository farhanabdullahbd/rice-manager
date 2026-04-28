import { useEffect, useRef, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';
import useAuthStore from '../store/authStore';

function Invoice({ sale, ref }) {
  if (!sale) return null;
  return (
    <div ref={ref} className="p-6 text-sm print:block hidden">
      <h2 className="text-xl font-bold text-center">🛒 POS সিস্টেম</h2>
      <p className="text-center text-gray-500">{sale.branch?.name}</p>
      <hr className="my-2" />
      <div className="flex justify-between text-xs">
        <span>ইনভয়েস: {sale.invoiceNo}</span>
        <span>{new Date(sale.createdAt).toLocaleString('bn-BD')}</span>
      </div>
      {sale.customer && <p className="text-xs mt-1">কাস্টমার: {sale.customer.name} ({sale.customer.phone})</p>}
      <hr className="my-2" />
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b font-semibold">
            <th className="text-left pb-1">পণ্য</th>
            <th className="text-right pb-1">পরিমাণ</th>
            <th className="text-right pb-1">দাম</th>
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
      <div className="text-xs space-y-0.5">
        <div className="flex justify-between"><span>সাব-টোটাল:</span><span>৳{Number(sale.subtotal)}</span></div>
        {Number(sale.discount) > 0 && <div className="flex justify-between text-green-700"><span>ছাড়:</span><span>-৳{Number(sale.discount)}</span></div>}
        <div className="flex justify-between font-bold text-base"><span>মোট:</span><span>৳{Number(sale.totalAmount)}</span></div>
        <div className="flex justify-between"><span>পরিশোধ:</span><span>৳{Number(sale.paidAmount)}</span></div>
        {Number(sale.dueAmount) > 0 && <div className="flex justify-between text-red-600"><span>বাকি:</span><span>৳{Number(sale.dueAmount)}</span></div>}
      </div>
      <p className="text-center text-xs text-gray-400 mt-4">ধন্যবাদ আবার আসবেন!</p>
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
  const invoiceRef = useRef();

  useEffect(() => {
    api.get('/products').then((r) => setProducts(r.data));
    api.get('/customers').then((r) => setCustomers(r.data));
  }, []);

  const handlePrint = useReactToPrint({ content: () => invoiceRef.current });

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.includes(search)
  );

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) return prev.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: product.id, name: product.name, unit: product.unit, unitPrice: Number(product.sellingPrice), quantity: 1, discount: 0 }];
    });
  };

  const updateCartItem = (idx, field, value) => {
    setCart((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: parseFloat(value) || 0 } : item));
  };

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
        discount: parseFloat(discount || 0),
        paidAmount: paid,
        paymentMethod,
      });
      const full = await api.get(`/sales/${data.id}`);
      setLastSale(full.data);
      toast.success('বিক্রয় সম্পন্ন!');
      setCart([]);
      setDiscount(0);
      setPaidAmount('');
      setCustomerId('');
      setTimeout(() => handlePrint(), 300);
    } catch (err) {
      toast.error(err.response?.data?.message || 'বিক্রয় ব্যর্থ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-4 h-full">
      {/* Product panel */}
      <div className="flex-1 flex flex-col gap-4">
        <input className="input" placeholder="পণ্য খুঁজুন (নাম / SKU)..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto max-h-[calc(100vh-180px)]">
          {filtered.map((p) => (
            <button key={p.id} onClick={() => addToCart(p)} className="card text-left hover:shadow-md hover:border-blue-300 border border-transparent transition cursor-pointer">
              <p className="font-medium text-sm text-gray-800 truncate">{p.name}</p>
              <p className="text-xs text-gray-400">{p.sku} · {p.unit}</p>
              <p className="text-blue-600 font-bold mt-1">৳{Number(p.sellingPrice)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Cart panel */}
      <div className="w-80 flex flex-col gap-3">
        <div className="card flex-1 flex flex-col overflow-hidden">
          <h3 className="font-semibold text-gray-700 mb-2">🛒 কার্ট</h3>
          <select className="input mb-2 text-sm" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">-- কাস্টমার (ঐচ্ছিক) --</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
          </select>
          <div className="flex-1 overflow-y-auto space-y-2">
            {cart.length === 0 && <p className="text-sm text-gray-400 text-center py-4">কার্ট খালি</p>}
            {cart.map((item, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-2 text-sm">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-gray-800 text-xs">{item.name}</span>
                  <button onClick={() => removeFromCart(idx)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                </div>
                <div className="flex gap-2 mt-1">
                  <input type="number" min="0.1" step="0.1" value={item.quantity} onChange={(e) => updateCartItem(idx, 'quantity', e.target.value)} className="input w-16 text-xs py-1" />
                  <input type="number" min="0" value={item.unitPrice} onChange={(e) => updateCartItem(idx, 'unitPrice', e.target.value)} className="input flex-1 text-xs py-1" />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>ছাড়: <input type="number" min="0" value={item.discount} onChange={(e) => updateCartItem(idx, 'discount', e.target.value)} className="w-14 border-b border-gray-300 text-center text-xs" /></span>
                  <span className="font-medium text-blue-700">৳{(item.quantity * item.unitPrice - item.discount).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment panel */}
        <div className="card space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">সাবটোটাল:</span><span>৳{subtotal.toFixed(2)}</span></div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 w-20">ছাড়:</span>
            <input type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} className="input py-1 text-sm" />
          </div>
          <div className="flex justify-between font-bold text-base"><span>মোট:</span><span className="text-blue-700">৳{total.toFixed(2)}</span></div>

          <select className="input text-sm" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="cash">নগদ</option>
            <option value="bkash">বিকাশ</option>
            <option value="nagad">নগদ মোবাইল</option>
            <option value="card">কার্ড</option>
            <option value="credit">বাকি</option>
          </select>

          <input type="number" min="0" placeholder={`পরিশোধ (৳${total.toFixed(2)})`} value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} className="input text-sm" />

          {change > 0 && <p className="text-green-600 text-xs">ফেরত: ৳{change.toFixed(2)}</p>}
          {due > 0 && <p className="text-red-600 text-xs">বাকি: ৳{due.toFixed(2)}</p>}

          <button onClick={handleSell} disabled={loading || cart.length === 0} className="btn btn-success w-full justify-center text-base">
            {loading ? 'প্রক্রিয়া হচ্ছে...' : '✅ বিক্রয় সম্পন্ন করুন'}
          </button>
          {lastSale && (
            <button onClick={handlePrint} className="btn btn-outline w-full justify-center text-xs">🖨️ রশিদ প্রিন্ট করুন</button>
          )}
        </div>
      </div>

      {/* Hidden invoice for print */}
      <div className="hidden">
        <Invoice sale={lastSale} ref={invoiceRef} />
      </div>
    </div>
  );
}
