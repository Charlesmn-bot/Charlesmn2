import React, { useState, useMemo, useEffect } from 'react';
import { Supplier, Purchase } from '../types';
import { TruckIcon } from './icons/TruckIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { formatStandardDate } from './dateFormatter';

interface SuppliersProps {
  suppliers: Supplier[];
  purchases: Purchase[];
  onAddSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
  onAddPurchase: (purchase: Omit<Purchase, 'id'>) => void;
  onUpdatePurchase: (purchase: Purchase) => void;
  onDeletePurchase: (id: string) => void;
}

type SortOrder = 'newest' | 'oldest';

const XCircleIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
)

export const Suppliers: React.FC<SuppliersProps> = ({ 
    suppliers, purchases, 
    onAddSupplier, onUpdateSupplier, onDeleteSupplier,
    onAddPurchase, onUpdatePurchase, onDeletePurchase 
}) => {
  const [isPurchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);

  const [isSupplierModalOpen, setSupplierModalOpen] = useState(false);

  const [filterBySupplier, setFilterBySupplier] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const getSupplierName = (supplierId: string) => suppliers.find(s => s.id === supplierId)?.name || 'Unknown';

  const openPurchaseModal = (purchase: Purchase | null = null) => {
    setEditingPurchase(purchase);
    setPurchaseModalOpen(true);
  };
  const closePurchaseModal = () => {
    setEditingPurchase(null);
    setPurchaseModalOpen(false);
  };

  const openSupplierModal = () => {
    setSupplierModalOpen(true);
  };
  const closeSupplierModal = () => {
    setSupplierModalOpen(false);
  };

  const filteredAndSortedPurchases = useMemo(() => {
    return purchases
      .filter(p => filterBySupplier === 'all' || p.supplierId === filterBySupplier)
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      });
  }, [purchases, filterBySupplier, sortOrder]);

  const PurchaseModal: React.FC = () => {
    interface PurchaseItem {
        product: string;
        cost: number; // Unit Cost
        quantity: number;
    }
    const initialItemState: PurchaseItem = { product: '', cost: 0, quantity: 1 };
    
    const [items, setItems] = useState<PurchaseItem[]>([initialItemState]);
    const [supplierId, setSupplierId] = useState(editingPurchase?.supplierId || (suppliers.length > 0 ? suppliers[0].id : ''));
    const [date, setDate] = useState(editingPurchase?.date || new Date().toISOString().split('T')[0]);

    const productList = useMemo(() => {
        const productMap = new Map<string, { cost: number }>();
        // Sort purchases by date to easily find the latest price for a product
        const sortedPurchases = [...purchases].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        for (const purchase of sortedPurchases) {
            if (!productMap.has(purchase.product)) {
                productMap.set(purchase.product, { cost: purchase.cost });
            }
        }
        // Convert map to array and sort by product name for the dropdown
        return Array.from(productMap.entries())
            .map(([product, { cost }]) => ({ product, cost }))
            .sort((a, b) => a.product.localeCompare(b.product));
    }, []); // Removed `purchases` dependency to prevent list from changing while modal is open

    useEffect(() => {
        if (editingPurchase) {
            setItems([{
                product: editingPurchase.product,
                cost: editingPurchase.cost,
                quantity: editingPurchase.quantity,
            }]);
            setSupplierId(editingPurchase.supplierId);
            setDate(editingPurchase.date);
        }
    }, [editingPurchase]);

    const handleItemChange = (index: number, field: keyof PurchaseItem, value: string | number) => {
        const newItems = [...items];
        const item = { ...newItems[index] };
        
        if (field === 'product') {
            item[field] = value as string;
        } else {
            const numValue = Number(value);
            // Prevent negative numbers for cost and quantity
            item[field] = numValue < 0 ? 0 : numValue;
        }
        newItems[index] = item;
        setItems(newItems);
    };
    
    const handleProductSelect = (index: number, selectedProduct: string) => {
        const newItems = [...items];
        if (selectedProduct === 'Other' || selectedProduct === '') {
            // Clear product and cost for user to input a new one
            newItems[index] = { ...newItems[index], product: '', cost: 0 };
        } else {
            const productInfo = productList.find(p => p.product === selectedProduct);
            if (productInfo) {
                // Set product and autofill latest known cost
                newItems[index] = { ...newItems[index], product: productInfo.product, cost: productInfo.cost };
            }
        }
        setItems(newItems);
    };


    const addItem = () => setItems([...items, initialItemState]);
    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingPurchase) {
            const item = items[0];
            if (!item.product || item.quantity <= 0 || item.cost < 0 || !supplierId) {
                alert("Please fill out all fields for the item (Product, Quantity > 0, Cost).");
                return;
            }
            onUpdatePurchase({
                ...editingPurchase,
                supplierId, date,
                product: item.product,
                cost: item.cost,
                quantity: item.quantity,
                totalCost: item.cost * item.quantity,
            });
        } else {
            const validItems = items.filter(item => item.product && item.quantity > 0 && item.cost >= 0);
            if (validItems.length === 0) {
                alert("Please add at least one valid item with product name, quantity, and cost."); return;
            }
            if (!supplierId) {
                 alert("Please select a supplier."); return;
            }
            validItems.forEach(item => {
                onAddPurchase({
                    supplierId, date,
                    product: item.product,
                    cost: item.cost,
                    quantity: item.quantity,
                    totalCost: item.cost * item.quantity,
                });
            });
        }
        closePurchaseModal();
    };

    const grandTotal = useMemo(() => items.reduce((total, item) => total + (item.cost * item.quantity), 0), [items]);
    
    const inputClasses = "w-full bg-brand-surface dark:bg-[#374151] border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-brand-header dark:bg-[#111827] rounded-lg shadow-xl p-5 w-full max-w-lg max-h-[90vh] flex flex-col">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{editingPurchase ? 'Edit Purchase' : 'Add New Purchase'}</h2>
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>Supplier</label>
                            <select name="supplierId" value={supplierId} onChange={e => setSupplierId(e.target.value)} className={inputClasses} required>
                                <option value="">Select Supplier</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClasses}>Date</label>
                            <input type="date" name="date" value={date} onChange={e => setDate(e.target.value)} className={inputClasses} required/>
                        </div>
                    </div>
                    <hr className="dark:border-gray-600"/>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">Products</h3>
                    <div className="space-y-3">
                        {items.map((item, index) => {
                            const isKnownProduct = productList.some(p => p.product === item.product);

                            return (
                             <div key={index} className="bg-brand-surface dark:bg-[#374151] p-3 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2 relative">
                                {!editingPurchase && items.length > 1 && (
                                    <button type="button" onClick={() => removeItem(index)} className="absolute -top-2 -right-2 text-red-500 hover:text-red-700 bg-brand-header dark:bg-gray-700 rounded-full">
                                        <XCircleIcon className="h-6 w-6"/>
                                    </button>
                                )}
                                <div>
                                    <label className={labelClasses}>Product</label>
                                    <select
                                        value={isKnownProduct ? item.product : 'Other'}
                                        onChange={e => handleProductSelect(index, e.target.value)}
                                        className={inputClasses}
                                    >
                                        <option value="">Select an existing product...</option>
                                        {productList.map(p => <option key={p.product} value={p.product}>{p.product}</option>)}
                                        <option value="Other">Add a new product...</option>
                                    </select>
                                    {!isKnownProduct && (
                                        <input
                                            type="text"
                                            placeholder="Enter new product name"
                                            value={item.product}
                                            onChange={e => handleItemChange(index, 'product', e.target.value)}
                                            className={`${inputClasses} mt-2`}
                                            required
                                        />
                                    )}
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className={labelClasses}>Quantity</label>
                                        <input type="number" placeholder="1" min="1" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} className={inputClasses} required />
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Unit Cost</label>
                                        <input type="number" placeholder="1000" min="0" value={item.cost} onChange={e => handleItemChange(index, 'cost', e.target.value)} className={inputClasses} required />
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Total Cost</label>
                                        <p className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-900 dark:text-white font-mono">
                                            {(item.cost * item.quantity).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            )
                        })}
                    </div>

                    {!editingPurchase && (
                        <button type="button" onClick={addItem} className="w-full flex items-center justify-center gap-2 text-sm p-2 bg-brand-surface dark:bg-[#374151] hover:bg-gray-100 dark:hover:bg-gray-600 border border-dashed border-gray-400 dark:border-gray-500 rounded-md transition">
                           <PlusCircleIcon className="h-5 w-5"/> Add Another Product
                        </button>
                    )}
                    
                    <div className="pt-4 mt-auto">
                        <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
                            <span className="font-bold text-lg text-gray-800 dark:text-gray-100">Grand Total</span>
                            <span className="font-bold text-xl text-gray-900 dark:text-white font-mono">Kshs {grandTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-end space-x-4 pt-4">
                            <button type="button" onClick={closePurchaseModal} className="px-4 py-2 bg-brand-surface dark:bg-[#374151] border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-blue-700 transition font-semibold">{editingPurchase ? 'Save Changes' : 'Save Purchase'}</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
  }
  
  const SupplierManagerModal: React.FC = () => {
    const [isFormVisible, setFormVisible] = useState(false);
    const [supplierData, setSupplierData] = useState<Omit<Supplier, 'id'>>({ name: '', contact: '' });
    const [editingSup, setEditingSup] = useState<Supplier | null>(null);

    const handleEditClick = (supplier: Supplier) => {
        setEditingSup(supplier);
        setSupplierData({ name: supplier.name, contact: supplier.contact });
        setFormVisible(true);
    }
    
    const handleAddNewClick = () => {
        setEditingSup(null);
        setSupplierData({ name: '', contact: '' });
        setFormVisible(true);
    }

    const handleCancel = () => {
        setEditingSup(null);
        setFormVisible(false);
    }

    const handleSaveSupplier = () => {
        if (!supplierData.name) {
            alert('Supplier name is required.');
            return;
        }
        if (editingSup) {
            onUpdateSupplier({ ...supplierData, id: editingSup.id });
        } else {
            onAddSupplier(supplierData);
        }
        handleCancel();
    }
    
    const handleDeleteSupplier = (id: string) => {
        if (window.confirm('Are you sure you want to delete this supplier? This will not delete their past purchases.')) {
            onDeleteSupplier(id);
        }
    }

    const inputClasses = "w-full bg-brand-surface dark:bg-[#374151] border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition";

    return (
         <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-brand-header dark:bg-[#111827] rounded-lg shadow-xl p-5 w-full max-w-md max-h-[80vh] flex flex-col">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Manage Suppliers</h2>
                
                <div className="flex-1 overflow-y-auto">
                    {!isFormVisible ? (
                        <>
                            <div className="space-y-2 mb-4">
                                {suppliers.map(s => (
                                    <div key={s.id} className="bg-brand-surface dark:bg-[#374151] p-3 rounded-md flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">{s.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{s.contact}</p>
                                        </div>
                                        <div className="space-x-2">
                                            <button onClick={() => handleEditClick(s)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm">Edit</button>
                                            <button onClick={() => handleDeleteSupplier(s.id)} className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 text-sm">Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={handleAddNewClick} className="w-full bg-brand-secondary text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-700 transition">Add New Supplier</button>
                        </>
                    ) : (
                        <div className="space-y-3">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{editingSup ? 'Edit Supplier' : 'Add New Supplier'}</h3>
                            <input type="text" placeholder="Supplier Name" value={supplierData.name} onChange={e => setSupplierData(p => ({...p, name: e.target.value}))} className={inputClasses} />
                            <input type="text" placeholder="Contact Info" value={supplierData.contact} onChange={e => setSupplierData(p => ({...p, contact: e.target.value}))} className={inputClasses} />
                            <div className="flex justify-end space-x-2">
                                <button onClick={handleCancel} className="px-4 py-2 bg-brand-surface dark:bg-[#374151] border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition">Cancel</button>
                                <button onClick={handleSaveSupplier} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-blue-700 transition font-semibold">Save</button>
                            </div>
                        </div>
                    )}
                </div>
                 <button onClick={closeSupplierModal} className="w-full mt-4 p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-800 rounded-md transition text-gray-600 dark:text-gray-300">Close</button>
            </div>
        </div>
    )
  }

  return (
    <div className="p-3">
      {isPurchaseModalOpen && <PurchaseModal />}
      {isSupplierModalOpen && <SupplierManagerModal />}
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Suppliers & Purchases</h1>

      <div className="bg-brand-surface dark:bg-[#374151] p-3 rounded-lg mb-4 space-y-3 md:space-y-0 md:flex md:justify-between md:items-center">
         <div className="flex items-center space-x-2">
            <select value={filterBySupplier} onChange={e => setFilterBySupplier(e.target.value)} className="bg-brand-header dark:bg-[#111827] border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-900 dark:text-white">
                <option value="all">All Suppliers</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={sortOrder} onChange={e => setSortOrder(e.target.value as SortOrder)} className="bg-brand-header dark:bg-[#111827] border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-900 dark:text-white">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
            </select>
         </div>
         <div className="flex items-center space-x-2">
            <button onClick={openSupplierModal} className="bg-brand-secondary text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-700 transition text-sm">Manage Suppliers</button>
            <button onClick={() => openPurchaseModal()} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition text-sm">Add Purchase</button>
         </div>
      </div>
      
      <div className="space-y-3">
        {filteredAndSortedPurchases.length > 0 ? filteredAndSortedPurchases.map((purchase) => (
          <div key={purchase.id} className="bg-brand-surface dark:bg-[#374151] p-3 rounded-lg flex items-start space-x-3">
            <div className="bg-brand-secondary p-3 rounded-full mt-1">
              <TruckIcon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">{purchase.product}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">from {getSupplierName(purchase.supplierId)}</p>
                </div>
                <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white text-lg">Kshs {purchase.totalCost.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{purchase.quantity} units @ {purchase.cost.toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
                 <p className="text-xs text-gray-500 dark:text-gray-400">{formatStandardDate(purchase.date)}</p>
                 <div className="space-x-2">
                    <button onClick={() => openPurchaseModal(purchase)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm">Edit</button>
                    <button onClick={() => {if (window.confirm('Delete this purchase record?')) onDeletePurchase(purchase.id)}} className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 text-sm">Delete</button>
                 </div>
              </div>
            </div>
          </div>
        )) : (
           <div className="text-center py-16">
            <p className="text-gray-500 dark:text-gray-400">No purchase records found for the selected filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};