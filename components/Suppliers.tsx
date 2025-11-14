
import React, { useState, useMemo } from 'react';
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

export const Suppliers: React.FC<SuppliersProps> = ({ 
    suppliers, purchases, 
    onAddSupplier, onUpdateSupplier, onDeleteSupplier,
    onAddPurchase, onUpdatePurchase, onDeletePurchase 
}) => {
  const [isPurchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);

  const [isSupplierModalOpen, setSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

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

  const openSupplierModal = (supplier: Supplier | null = null) => {
    setEditingSupplier(supplier);
    setSupplierModalOpen(true);
  };
  const closeSupplierModal = () => {
    setEditingSupplier(null);
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
    const [purchaseData, setPurchaseData] = useState<Omit<Purchase, 'id'>>({
        supplierId: editingPurchase?.supplierId || (suppliers[0]?.id || ''),
        product: editingPurchase?.product || '',
        cost: editingPurchase?.cost || 0,
        totalCost: editingPurchase?.totalCost || 0,
        date: editingPurchase?.date || new Date().toISOString().split('T')[0],
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setPurchaseData(prev => ({...prev, [name]: name.includes('cost') || name.includes('Cost') ? parseFloat(value) : value }));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!purchaseData.product || purchaseData.totalCost <= 0 || !purchaseData.supplierId) {
            alert("Please fill out all fields.");
            return;
        }
        if (editingPurchase) {
            onUpdatePurchase({ ...purchaseData, id: editingPurchase.id });
        } else {
            onAddPurchase(purchaseData);
        }
        closePurchaseModal();
    }
    
    const inputClasses = "w-full bg-brand-surface dark:bg-[#374151] border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

    return (
         <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-brand-header dark:bg-[#111827] rounded-lg shadow-xl p-5 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{editingPurchase ? 'Edit Purchase' : 'Add Purchase'}</h2>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className={labelClasses}>Product</label>
                        <input type="text" name="product" value={purchaseData.product} onChange={handleChange} className={inputClasses} required />
                    </div>
                    <div>
                        <label className={labelClasses}>Supplier</label>
                        <select name="supplierId" value={purchaseData.supplierId} onChange={handleChange} className={inputClasses} required>
                            <option value="">Select Supplier</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                         <div>
                            <label className={labelClasses}>Unit Cost</label>
                            <input type="number" name="cost" value={purchaseData.cost} onChange={handleChange} className={inputClasses} />
                        </div>
                        <div>
                            <label className={labelClasses}>Total Cost</label>
                            <input type="number" name="totalCost" value={purchaseData.totalCost} onChange={handleChange} className={inputClasses} required />
                        </div>
                    </div>
                    <div>
                        <label className={labelClasses}>Date</label>
                        <input type="date" name="date" value={purchaseData.date} onChange={handleChange} className={inputClasses} required />
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={closePurchaseModal} className="px-4 py-2 bg-brand-surface dark:bg-[#374151] border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-blue-700 transition font-semibold">Save</button>
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
            <div className="bg-brand-header dark:bg-[#111827] rounded-lg shadow-xl p-5 w-full max-w-md max-h-[80vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Manage Suppliers</h2>
                
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
                 <button onClick={() => setSupplierModalOpen(false)} className="w-full mt-4 p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-800 rounded-md transition text-gray-600 dark:text-gray-300">Close</button>
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
            <button onClick={() => setSupplierModalOpen(true)} className="bg-brand-secondary text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-700 transition text-sm">Manage Suppliers</button>
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
                <span className="font-bold text-gray-900 dark:text-white text-lg">Kshs {purchase.totalCost.toLocaleString()}</span>
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
