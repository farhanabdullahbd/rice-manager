import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import api from '../api/axios';
import toast from 'react-hot-toast';

const UNITS = ['kg', 'piece', 'bag', 'liter', 'ton', 'box'];

// ── QR কোড মডাল ──
function QRModal({ product, onClose }) {
  const printRef = useRef();
  const handlePrint = useReactToPrint({ content: () => printRef.current });

  const qrData = JSON.stringify({
    id: product.id, name: product.name, sku: product.sku,
    price: product.sellingPrice, unit: product.unit,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-xs text-center shadow-2xl">
        <h3 className="font-bold text-gray-900 mb-1">QR কোড</h3>
        <p className="text-xs text-gray-500 mb-4">{product.name}</p>
        <div ref={printRef} className="bg-white p-4 rounded-2xl border border-gray-100 inline-block mx-auto">
          <QRCodeSVG value={qrData} size={160} level="H" />
          <p className="text-gray-500 text-xs mt-2 font-mono">{product.sku}</p>
          <p className="text-gray-900 text-sm font-bold">{product.name}</p>
          <p className="text-gray-500 text-xs">৳{Number(product.sellingPrice)} / {product.unit}</p>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={handlePrint} className="btn btn-primary flex-1 justify-center">🖨️ প্রিন্ট</button>
          <button onClick={onClose} className="btn btn-outline flex-1 justify-center">বন্ধ</button>
        </div>
      </div>
    </div>
  );
}

// ── পণ্য সম্পাদনা মডাল (নাম, SKU পরিবর্তন) ──
function EditProductModal({ product, categories, onClose, onSave }) {
  const [form, setForm] = useState(product || {
    name: '', sku: '', unit: 'kg', purchasePrice: '', sellingPrice: '', categoryId: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (product) await api.put(`/products/${product.id}`, form);
      else await api.post('/products', form);
      toast.success(product ? 'পণ্য আপডেট হয়েছে' : 'পণ্য যোগ হয়েছে');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'সমস্যা হয়েছে');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="font-bold text-gray-900 text-lg mb-5">
          {product ? '✏️ পণ্য সম্পাদনা' : '+ নতুন পণ্য'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input className="input" placeholder="পণ্যের নাম *"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="input" placeholder="SKU (যেমন: RICE-001) *"
            value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
          <div className="grid grid-cols-2 gap-2">
            <select className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            <select className="input" value={form.categoryId || ''}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">-- ক্যাটাগরি --</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">ক্রয়মূল্য (৳)</label>
              <input className="input" type="number" placeholder="0"
                value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">বিক্রয়মূল্য (৳)</label>
              <input className="input" type="number" placeholder="0"
                value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} required />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading} className="btn btn-primary flex-1 justify-center">
              {loading ? 'সংরক্ষণ...' : 'সংরক্ষণ করুন'}
            </button>
            <button type="button" onClick={onClose} className="btn btn-outline flex-1 justify-center">বাতিল</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── মাল যোগ মডাল (স্টক বাড়ানো + নতুন মূল্য) ──
function AddStockModal({ product, suppliers, onClose, onSave }) {
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState(product.purchasePrice);
  const [sellingPrice, setSellingPrice] = useState(product.sellingPrice);
  const [supplierId, setSupplierId] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [updatePrices, setUpdatePrices] = useState(true);
  const [loading, setLoading] = useState(false);

  const total = (parseFloat(quantity) || 0) * (parseFloat(purchasePrice) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // ১. মাল কেনা record তৈরি — inventory auto বাড়বে
      await api.post('/purchases', {
        supplierId: supplierId || null,
        items: [{
          productId: product.id,
          quantity: parseFloat(quantity),
          unitPrice: parseFloat(purchasePrice),
        }],
        paidAmount: paidAmount === '' ? total : parseFloat(paidAmount),
        paymentMethod: 'cash',
      });

      // ২. পণ্যের মূল্য আপডেট (যদি check করা থাকে)
      if (updatePrices &&
          (Number(purchasePrice) !== Number(product.purchasePrice) ||
           Number(sellingPrice) !== Number(product.sellingPrice))) {
        await api.put(`/products/${product.id}`, {
          ...product,
          purchasePrice: parseFloat(purchasePrice),
          sellingPrice: parseFloat(sellingPrice),
        });
      }

      toast.success(`${quantity} ${product.unit} মাল যোগ হয়েছে`);
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'সমস্যা হয়েছে');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="font-bold text-gray-900 text-lg mb-1">📦 মাল যোগ করুন</h3>
        <p className="text-sm text-gray-500 mb-5">{product.name} ({product.sku})</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">পরিমাণ * ({product.unit})</label>
            <input className="input" type="number" min="0.1" step="0.1" placeholder={`কত ${product.unit}?`}
              value={quantity} onChange={(e) => setQuantity(e.target.value)} required autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">নতুন ক্রয়মূল্য *</label>
              <input className="input" type="number" min="0"
                value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} required />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">নতুন বিক্রয়মূল্য</label>
              <input className="input" type="number" min="0"
                value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
            <input type="checkbox" checked={updatePrices} onChange={(e) => setUpdatePrices(e.target.checked)}
              className="w-4 h-4 accent-orange-500" />
            পণ্যের মূল্য আপডেট করুন
          </label>

          <select className="input" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            <option value="">-- সরবরাহকারী (ঐচ্ছিক) --</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              পরিশোধ (মোট: ৳{total.toFixed(2)})
            </label>
            <input className="input" type="number" min="0" placeholder={total.toFixed(0)}
              value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} />
            <p className="text-xs text-gray-400 mt-1">খালি রাখলে সম্পূর্ণ পরিশোধিত ধরা হবে</p>
          </div>

          <div className="rounded-xl p-3" style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
            <div className="flex justify-between text-sm">
              <span className="text-gray-700 font-medium">মোট</span>
              <span className="font-bold text-orange-600">৳{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading || !quantity} className="btn btn-primary flex-1 justify-center">
              {loading ? 'সংরক্ষণ...' : '✓ মাল যোগ করুন'}
            </button>
            <button type="button" onClick={onClose} className="btn btn-outline flex-1 justify-center">বাতিল</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── মূল পেজ ──
export default function Products() {
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | low

  const [editModal, setEditModal] = useState(null);
  const [qrProduct, setQrProduct] = useState(null);
  const [stockProduct, setStockProduct] = useState(null);

  const load = () => {
    api.get('/products').then((r) => setProducts(r.data));
    api.get('/inventory').then((r) => setInventory(r.data));
    api.get('/products/meta/categories').then((r) => setCategories(r.data));
    api.get('/suppliers').then((r) => setSuppliers(r.data)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  // প্রতিটি পণ্যের সাথে স্টক merge করি
  const productsWithStock = products.map((p) => {
    const inv = inventory.find((i) => i.productId === p.id);
    return {
      ...p,
      stock: inv ? Number(inv.quantity) : 0,
      minStockAlert: inv ? Number(inv.minStockAlert) : 10,
      isLow: inv ? Number(inv.quantity) <= Number(inv.minStockAlert) : true,
    };
  });

  const filtered = productsWithStock
    .filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.includes(search)
    )
    .filter((p) => filter === 'all' || (filter === 'low' && p.isLow));

  const lowCount = productsWithStock.filter((p) => p.isLow).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-header">পণ্য ও স্টক</h2>
          <p className="page-sub">
            {products.length} টি পণ্য
            {lowCount > 0 && <span className="ml-1 text-red-500"> · {lowCount} টি কম স্টক</span>}
          </p>
        </div>
        <button onClick={() => setEditModal({})} className="btn btn-primary">+ নতুন পণ্য</button>
      </div>

      {/* Search + Filter */}
      <div className="space-y-2">
        <input className="input" placeholder="🔍 পণ্য খুঁজুন (নাম / SKU)..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="flex gap-2">
          <button onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
            সব ({products.length})
          </button>
          {lowCount > 0 && (
            <button onClick={() => setFilter('low')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === 'low' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-600'
              }`}>
              ⚠️ কম স্টক ({lowCount})
            </button>
          )}
        </div>
      </div>

      {/* Product list */}
      <div className="space-y-2">
        {filtered.map((p) => (
          <div key={p.id} className="card">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{p.name}</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{p.sku} · {p.unit}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs">
                  <span className="text-gray-500">
                    ক্রয় <span className="font-semibold text-gray-700">৳{Number(p.purchasePrice)}</span>
                  </span>
                  <span className="text-gray-500">
                    বিক্রয় <span className="font-semibold text-orange-500">৳{Number(p.sellingPrice)}</span>
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className={`font-bold text-base ${p.isLow ? 'text-red-500' : 'text-green-600'}`}>
                  {p.stock} {p.unit}
                </p>
                <p className="text-xs text-gray-400">
                  {p.isLow ? '⚠️ কম স্টক' : '✓ স্টক'}
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: '1px solid #F9FAFB' }}>
              <button onClick={() => setStockProduct(p)}
                className="flex-1 text-xs py-2 rounded-xl font-semibold bg-orange-50 text-orange-600 hover:bg-orange-100 transition-all">
                📦 মাল যোগ
              </button>
              <button onClick={() => setQrProduct(p)}
                className="text-xs px-3 py-2 rounded-xl font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all">
                📱 QR
              </button>
              <button onClick={() => setEditModal(p)}
                className="text-xs px-3 py-2 rounded-xl font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all">
                ✏️
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-10">
            <p className="text-3xl mb-2">📦</p>
            <p className="text-gray-400">কোনো পণ্য পাওয়া যায়নি</p>
          </div>
        )}
      </div>

      {editModal !== null && (
        <EditProductModal product={editModal?.id ? editModal : null} categories={categories}
          onClose={() => setEditModal(null)} onSave={() => { setEditModal(null); load(); }} />
      )}
      {qrProduct && <QRModal product={qrProduct} onClose={() => setQrProduct(null)} />}
      {stockProduct && (
        <AddStockModal product={stockProduct} suppliers={suppliers}
          onClose={() => setStockProduct(null)} onSave={() => { setStockProduct(null); load(); }} />
      )}
    </div>
  );
}
