'use client';

import { useEffect, useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSearch } from 'react-icons/fi';

interface Attribute {
  key: string;
  value: string;
}

interface AttributePriceRule {
  key: string;
  value: string;
  price: number;
}

interface AttributeQuantityRule {
  key: string;
  value: string;
  quantity: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  unitType: string;
  price: number;
  image: string;
  minQuantity: number;
  createdAt: string;
  updatedAt: string;
  attributes?: Attribute[];
  attributePriceRules?: AttributePriceRule[];
  attributeQuantityRules?: AttributeQuantityRule[];
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [prodRes, invRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/inventory'),
      ]);
      const [prodData, invData] = await Promise.all([prodRes.json(), invRes.json()]);
      setProducts(prodData || []);
      setInventory(invData || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStock = (productId: string) => {
    const rows = inventory.filter((i: any) => i.productId === productId);
    return {
      available: rows.reduce((s: number, i: any) => s + (i.availableQuantity || 0), 0),
      total: rows.reduce((s: number, i: any) => s + (i.totalQuantity || 0), 0),
    };
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(products.map(p => p.category))];

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (response.ok) setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Product Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <FiPlus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attributes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price Rules</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty by Variant</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Stock</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Min Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.length === 0 && (
                <tr><td colSpan={9} className="px-6 py-10 text-center text-gray-400">No products found.</td></tr>
              )}
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">{product.name.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-mono">{product.sku}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{product.category}</span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {product.attributes?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {product.attributes.slice(0, 2).map((attr) => (
                          <span key={attr.key + attr.value} className="px-2 py-1 text-xs bg-gray-100 rounded-full text-gray-700">
                            {attr.key}: {attr.value}
                          </span>
                        ))}
                        {product.attributes.length > 2 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 rounded-full text-gray-500">+{product.attributes.length - 2}</span>
                        )}
                      </div>
                    ) : <span className="text-gray-400 text-xs">—</span>}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {product.attributePriceRules?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {product.attributePriceRules.slice(0, 2).map((rule, idx) => (
                          <span key={idx} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                            {rule.value}: ${rule.price.toFixed(2)}
                          </span>
                        ))}
                        {product.attributePriceRules.length > 2 && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-500 rounded-full">+{product.attributePriceRules.length - 2}</span>
                        )}
                      </div>
                    ) : <span className="text-gray-400 text-xs">—</span>}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {product.attributeQuantityRules?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {product.attributeQuantityRules.slice(0, 2).map((rule, idx) => (
                          <span key={idx} className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                            {rule.value}: {rule.quantity}
                          </span>
                        ))}
                        {product.attributeQuantityRules.length > 2 && (
                          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-500 rounded-full">+{product.attributeQuantityRules.length - 2}</span>
                        )}
                      </div>
                    ) : <span className="text-gray-400 text-xs">—</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                    {getStock(product.id).total}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900">${product.price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900">{product.minQuantity}</td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button onClick={() => setEditingProduct(product)} className="text-blue-600 hover:text-blue-800">
                      <FiEdit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-800">
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(showAddModal || editingProduct) && (
        <ProductModal
          product={editingProduct}
          onClose={() => { setShowAddModal(false); setEditingProduct(null); }}
          onSave={(product) => {
            if (editingProduct) {
              setProducts(products.map(p => p.id === product.id ? product : p));
            } else {
              setProducts([...products, product]);
            }
            setShowAddModal(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
}

function ProductModal({ product, onClose, onSave }: { product?: Product | null; onClose: () => void; onSave: (p: Product) => void }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    category: product?.category || '',
    description: product?.description || '',
    unitType: product?.unitType || 'PCS',
    price: product?.price || 0,
    minQuantity: product?.minQuantity || 0,
    attributes: product?.attributes || [] as Attribute[],
    attributePriceRules: product?.attributePriceRules || [] as AttributePriceRule[],
    attributeQuantityRules: product?.attributeQuantityRules || [] as AttributeQuantityRule[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = product ? `/api/products/${product.id}` : '/api/products';
      const method = product ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) onSave(await response.json());
    } catch (error) {
      console.error('Failed to save product:', error);
    }
  };

  // Attributes
  const updateAttribute = (i: number, field: 'key' | 'value', val: string) => {
    const updated = [...formData.attributes];
    updated[i] = { ...updated[i], [field]: val };
    setFormData({ ...formData, attributes: updated });
  };

  // Price rules
  const updatePriceRule = (i: number, field: 'key' | 'value' | 'price', val: string) => {
    const updated = [...formData.attributePriceRules];
    updated[i] = { ...updated[i], [field]: field === 'price' ? parseFloat(val || '0') : val };
    setFormData({ ...formData, attributePriceRules: updated });
  };

  // Quantity rules
  const updateQtyRule = (i: number, field: 'key' | 'value' | 'quantity', val: string) => {
    const updated = [...formData.attributeQuantityRules];
    updated[i] = { ...updated[i], [field]: field === 'quantity' ? parseInt(val || '0') : val };
    setFormData({ ...formData, attributeQuantityRules: updated });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 sm:p-8">
        <h2 className="text-2xl font-bold mb-6">{product ? 'Edit Product' : 'Add Product'}</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input type="text" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input type="text" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Type</label>
              <select value={formData.unitType} onChange={e => setFormData({ ...formData, unitType: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="PCS">PCS</option>
                <option value="KG">KG</option>
                <option value="BOX">BOX</option>
                <option value="LTR">LTR</option>
                <option value="MTR">MTR</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
              <input type="number" step="0.01" value={formData.price}
                onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Quantity</label>
              <input type="number" value={formData.minQuantity}
                onChange={e => setFormData({ ...formData, minQuantity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" rows={3} />
          </div>

          {/* Product Attributes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-gray-700">Product Attributes</label>
              <button type="button" onClick={() => setFormData({ ...formData, attributes: [...formData.attributes, { key: '', value: '' }] })}
                className="text-sm text-blue-600 hover:text-blue-800">+ Add attribute</button>
            </div>
            {formData.attributes.length === 0 && (
              <p className="text-sm text-gray-400">e.g. Color: Silver, Size: Large, Brand: Apex</p>
            )}
            {formData.attributes.map((attr, i) => (
              <div key={i} className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Attribute (e.g. Color)" value={attr.key}
                  onChange={e => updateAttribute(i, 'key', e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                <div className="flex gap-2">
                  <input type="text" placeholder="Value (e.g. Silver)" value={attr.value}
                    onChange={e => updateAttribute(i, 'value', e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  <button type="button" onClick={() => setFormData({ ...formData, attributes: formData.attributes.filter((_, idx) => idx !== i) })}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm">Remove</button>
                </div>
              </div>
            ))}
          </div>

          {/* Price Rules by Attribute */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-gray-700">Price Rules by Attribute</label>
              <button type="button" onClick={() => setFormData({ ...formData, attributePriceRules: [...formData.attributePriceRules, { key: '', value: '', price: 0 }] })}
                className="text-sm text-blue-600 hover:text-blue-800">+ Add price rule</button>
            </div>
            {formData.attributePriceRules.length === 0 && (
              <p className="text-sm text-gray-400">Set different prices per variant (e.g. Color: Black → $1049.99)</p>
            )}
            {formData.attributePriceRules.map((rule, i) => (
              <div key={i} className="grid grid-cols-3 gap-3">
                <input type="text" placeholder="Attribute (e.g. Color)" value={rule.key}
                  onChange={e => updatePriceRule(i, 'key', e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                <input type="text" placeholder="Value (e.g. Black)" value={rule.value}
                  onChange={e => updatePriceRule(i, 'value', e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                <div className="flex gap-2">
                  <input type="number" step="0.01" placeholder="Price" value={rule.price}
                    onChange={e => updatePriceRule(i, 'price', e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  <button type="button" onClick={() => setFormData({ ...formData, attributePriceRules: formData.attributePriceRules.filter((_, idx) => idx !== i) })}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm">Remove</button>
                </div>
              </div>
            ))}
          </div>

          {/* Quantity Rules by Attribute */}
          <div className="space-y-3 border border-purple-200 rounded-xl p-4 bg-purple-50">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-semibold text-purple-800">Quantity by Attribute Variant</label>
                <p className="text-xs text-purple-600 mt-0.5">Track how much stock exists per variant (e.g. Color: Silver → 30 units)</p>
              </div>
              <button type="button"
                onClick={() => setFormData({ ...formData, attributeQuantityRules: [...formData.attributeQuantityRules, { key: '', value: '', quantity: 0 }] })}
                className="text-sm text-purple-700 hover:text-purple-900 font-medium">+ Add variant qty</button>
            </div>
            {formData.attributeQuantityRules.length === 0 && (
              <p className="text-sm text-gray-400">No variant quantities defined. Click "+ Add variant qty" to start.</p>
            )}
            {formData.attributeQuantityRules.map((rule, i) => (
              <div key={i} className="grid grid-cols-3 gap-3">
                <input type="text" placeholder="Attribute (e.g. Color)" value={rule.key}
                  onChange={e => updateQtyRule(i, 'key', e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-400 bg-white" />
                <input type="text" placeholder="Value (e.g. Silver)" value={rule.value}
                  onChange={e => updateQtyRule(i, 'value', e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-400 bg-white" />
                <div className="flex gap-2">
                  <input type="number" placeholder="Quantity" value={rule.quantity}
                    onChange={e => updateQtyRule(i, 'quantity', e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-400 bg-white" min="0" />
                  <button type="button"
                    onClick={() => setFormData({ ...formData, attributeQuantityRules: formData.attributeQuantityRules.filter((_, idx) => idx !== i) })}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm">Remove</button>
                </div>
              </div>
            ))}
            {formData.attributeQuantityRules.length > 0 && (
              <div className="pt-2 border-t border-purple-200 text-sm text-purple-700 font-medium">
                Total variant qty: {formData.attributeQuantityRules.reduce((s, r) => s + (r.quantity || 0), 0)} units
              </div>
            )}
          </div>

          <div className="flex space-x-3 pt-2">
            <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium">
              {product ? 'Update Product' : 'Add Product'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 font-medium">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
