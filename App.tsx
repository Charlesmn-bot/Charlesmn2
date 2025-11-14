
import React, { useState, useCallback, useEffect } from 'react';
import { Sale, Status, SaleType, PaymentMethod, Technician, Supplier, Purchase, CustomerServiceRepresentative, User } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { STORE_NAME } from './constants';

import { Dashboard } from './components/Dashboard';
import { OrderForm as SaleForm } from './components/OrderForm';
import { Scanner } from './components/Scanner';
import { Settings } from './components/Settings';
import { Receipt } from './components/Receipt';
import { Login } from './components/Login';
import { Suppliers } from './components/Suppliers';
import { TotalSales } from './components/TotalSales';

import { ClipboardListIcon } from './components/icons/ClipboardListIcon';
import { PlusCircleIcon } from './components/icons/PlusCircleIcon';
import { CogIcon } from './components/icons/CogIcon';
import { TruckIcon } from './components/icons/TruckIcon';
import { ChartBarIcon } from './components/icons/ChartBarIcon';

type Tab = 'Sales' | 'Suppliers' | 'Totals' | 'Settings';
type View = 'list' | 'form' | 'receipt' | 'scanner';

const initialTechnicians: Technician[] = [
    { id: '1', name: 'Harrison' }, { id: '2', name: 'Amon' }, { id: '3', name: 'KamJay' },
    { id: '4', name: 'Saidy' }, { id: '5', name: 'John' }, { id: '6', name: 'Charles' }, { id: '7', name: 'Njoro' },
];

const initialCsrs: CustomerServiceRepresentative[] = [
    { id: 'csr-a1b2', name: 'Alice' },
    { id: 'csr-c3d4', name: 'Bob' },
];

const initialSuppliers: Supplier[] = [
    { id: 'sup1', name: 'Phone Parts Inc', contact: '0712345678' },
    { id: 'sup2', name: 'Accessory World', contact: '0787654321' },
];

const initialPurchases: Purchase[] = [
    { id: 'pur1', supplierId: 'sup1', product: 'iPhone 13 Screens', cost: 12000, quantity: 5, totalCost: 60000, date: '2023-10-20' },
    { id: 'pur2', supplierId: 'sup2', product: 'Samsung Chargers', cost: 500, quantity: 20, totalCost: 10000, date: '2023-10-22' },
];

const initialSales: Sale[] = [
    {
        id: '1', receiptNumber: 'GSM-0001', customerName: 'John Doe', phoneType: 'iPhone 13 Pro', saleType: SaleType.Repair,
        repairType: 'Screen Replacement', price: 15000, assignedTechnician: '1',
        storageLocation: 'A1', notes: 'Customer waiting.', dateBooked: '2023-10-26T10:00:00Z', receiptDate: '2023-10-26T10:00:00Z', status: Status.Completed,
        paymentMethod: PaymentMethod.Mpesa, mpesaNumber: '254712345678'
    },
    {
        id: '2', receiptNumber: 'GSM-0002', customerName: 'Jane Smith', phoneType: 'Samsung S22 Ultra', saleType: SaleType.Repair,
        repairType: 'Battery Replacement', price: 8500, assignedTechnician: '2',
        storageLocation: 'A2', notes: '', dateBooked: '2023-10-27T11:30:00Z', receiptDate: '2023-10-27T11:30:00Z', status: Status.InProgress,
        paymentMethod: PaymentMethod.Cash
    },
     {
        id: '3', receiptNumber: 'GSM-0003', customerName: 'Peter Jones', phoneType: 'Type-C Cable', saleType: SaleType.Accessory,
        price: 800, notes: 'Fast charging model', dateBooked: '2023-10-28T14:00:00Z', receiptDate: '2023-10-28T14:00:00Z', status: Status.Completed,
        paymentMethod: PaymentMethod.Cash
    },
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('gsm-pos-user', null);
  const [activeTab, setActiveTab] = useState<Tab>('Sales');
  const [theme, setTheme] = useLocalStorage<string>('gsm-pos-theme', 'light');
  
  const [sales, setSales] = useLocalStorage<Sale[]>('gsm-sales', initialSales);
  const [technicians, setTechnicians] = useLocalStorage<Technician[]>('gsm-technicians', initialTechnicians);
  const [csrs, setCsrs] = useLocalStorage<CustomerServiceRepresentative[]>('gsm-csrs', initialCsrs);
  const [suppliers, setSuppliers] = useLocalStorage<Supplier[]>('gsm-suppliers', initialSuppliers);
  const [purchases, setPurchases] = useLocalStorage<Purchase[]>('gsm-purchases', initialPurchases);
  
  const [currentView, setCurrentView] = useState<View>('list');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isCreatingSale, setIsCreatingSale] = useState<boolean>(false);
  const [saleTypeToCreate, setSaleTypeToCreate] = useState<SaleType | null>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleLogin = (user: User) => setCurrentUser(user);
  const handleLogout = () => setCurrentUser(null);

  const handleSaveSale = (sale: Sale) => {
    const index = sales.findIndex(o => o.id === sale.id);
    if (index > -1) {
      const newSales = [...sales];
      newSales[index] = sale;
      setSales(newSales);
    } else {
      setSales([...sales, sale]);
    }
    resetView();
    setActiveTab('Sales');
  };
  
  const handleViewSale = useCallback((sale: Sale) => {
    setSelectedSale(sale);
    setCurrentView('receipt');
  }, []);

  const handleEditSale = useCallback((saleToEdit: Sale) => {
    setSelectedSale(saleToEdit);
    setSaleTypeToCreate(saleToEdit.saleType);
    setCurrentView('form');
  }, []);

  const handleScan = useCallback((saleId: string) => {
    const foundSale = sales.find(o => o.id === saleId);
    if (foundSale) {
      handleViewSale(foundSale);
    } else {
      alert(`Sale with ID ${saleId} not found.`);
    }
    resetView();
    setActiveTab('Sales');
  }, [sales, handleViewSale]);
  
  const handleOpenScanner = () => setCurrentView('scanner');

  const getNewReceiptNumber = useCallback(() => {
    const lastReceipt = sales.map(o => parseInt(o.receiptNumber.split('-')[1])).sort((a,b) => b-a)[0] || 0;
    return `GSM-${(lastReceipt + 1).toString().padStart(4, '0')}`;
  }, [sales]);
  
  const resetView = () => {
    setCurrentView('list');
    setSelectedSale(null);
    setIsCreatingSale(false);
    setSaleTypeToCreate(null);
  };
  
  // --- Technician CRUD ---
  const addTechnician = (name: string) => setTechnicians([...technicians, { id: crypto.randomUUID(), name }]);
  const updateTechnician = (tech: Technician) => setTechnicians(technicians.map(t => t.id === tech.id ? tech : t));
  const deleteTechnician = (id: string) => setTechnicians(technicians.filter(t => t.id !== id));
  
  // --- CSR CRUD ---
  const addCsr = (name: string) => setCsrs([...csrs, { id: crypto.randomUUID(), name }]);
  const updateCsr = (csr: CustomerServiceRepresentative) => setCsrs(csrs.map(c => c.id === csr.id ? csr : c));
  const deleteCsr = (id: string) => setCsrs(csrs.filter(c => c.id !== id));
  
  // --- Supplier CRUD ---
  const addSupplier = (supplier: Omit<Supplier, 'id'>) => setSuppliers([...suppliers, { ...supplier, id: crypto.randomUUID() }]);
  const updateSupplier = (supplier: Supplier) => setSuppliers(suppliers.map(s => s.id === supplier.id ? supplier : s));
  const deleteSupplier = (id: string) => setSuppliers(suppliers.filter(s => s.id !== id));

  // --- Purchase CRUD ---
  const addPurchase = (purchase: Omit<Purchase, 'id'>) => setPurchases([...purchases, { ...purchase, id: crypto.randomUUID() }]);
  const updatePurchase = (purchase: Purchase) => setPurchases(purchases.map(p => p.id === purchase.id ? purchase : p));
  const deletePurchase = (id: string) => setPurchases(purchases.filter(p => p.id !== id));
  
  if (!currentUser) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  const renderContent = () => {
    if (currentView === 'receipt' && selectedSale) {
      return <Receipt sale={selectedSale} onClose={resetView} onEdit={handleEditSale} technicians={technicians} currentUser={currentUser} />;
    }
    if (currentView === 'form' && (saleTypeToCreate || selectedSale)) {
      return <SaleForm saleType={selectedSale?.saleType || saleTypeToCreate!} saleToEdit={selectedSale} onSave={handleSaveSale} onCancel={resetView} getNewReceiptNumber={getNewReceiptNumber} technicians={technicians}/>;
    }
    if (currentView === 'scanner') {
        return <Scanner onScan={handleScan} onClose={resetView} />;
    }
    
    switch (activeTab) {
      case 'Sales':
        return <Dashboard sales={sales} onViewSale={handleViewSale} onOpenScanner={handleOpenScanner} />;
      case 'Suppliers':
        return <Suppliers 
                    suppliers={suppliers} 
                    purchases={purchases} 
                    onAddSupplier={addSupplier}
                    onUpdateSupplier={updateSupplier}
                    onDeleteSupplier={deleteSupplier}
                    onAddPurchase={addPurchase}
                    onUpdatePurchase={updatePurchase}
                    onDeletePurchase={deletePurchase}
                />;
      case 'Totals':
        return <TotalSales sales={sales} />;
      case 'Settings':
        return <Settings 
            onLogout={handleLogout} 
            technicians={technicians}
            onAddTechnician={addTechnician}
            onUpdateTechnician={updateTechnician}
            onDeleteTechnician={deleteTechnician}
            csrs={csrs}
            onAddCsr={addCsr}
            onUpdateCsr={updateCsr}
            onDeleteCsr={deleteCsr}
            theme={theme}
            toggleTheme={toggleTheme}
            currentUser={currentUser}
        />;
      default:
        return <Dashboard sales={sales} onViewSale={handleViewSale} onOpenScanner={handleOpenScanner} />;
    }
  };

  const navItems = [
    { name: 'Sales' as Tab, icon: ClipboardListIcon },
    { name: 'Totals' as Tab, icon: ChartBarIcon },
    { name: 'Suppliers' as Tab, icon: TruckIcon },
    { name: 'Settings' as Tab, icon: CogIcon },
  ];

  const handleNavClick = (tab: Tab) => {
    setActiveTab(tab);
    resetView();
  }
  
  const SaleTypeSelectorModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
        <div className="bg-brand-header dark:bg-[#111827] rounded-lg shadow-xl p-6 w-full max-w-sm space-y-4">
             <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white">Select Sale Type</h2>
             {Object.values(SaleType).map(type => (
                 <button key={type} onClick={() => { setSaleTypeToCreate(type); setIsCreatingSale(false); setCurrentView('form'); }} className="w-full text-left p-4 bg-brand-surface dark:bg-[#374151] hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition text-gray-900 dark:text-white font-semibold">
                    {type}
                 </button>
             ))}
             <button onClick={() => setIsCreatingSale(false)} className="w-full mt-2 p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-800 rounded-md transition text-gray-600 dark:text-gray-300">Cancel</button>
        </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-brand-bg dark:bg-[#1F2937] font-sans">
      <header className="bg-brand-header dark:bg-[#111827] p-3 shadow-md sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800">
        <div className="flex justify-center items-center relative">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white text-center">{STORE_NAME}</h1>
          {currentUser && (
            <div className="absolute right-0 text-right pr-2">
              <p className="font-semibold text-sm text-gray-900 dark:text-white">{currentUser.username}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser.role}</p>
            </div>
          )}
        </div>
      </header>

      <main className="pb-20 text-gray-800 dark:text-gray-200">
        {renderContent()}
      </main>

      {activeTab === 'Sales' && currentView === 'list' && (
        <button
            onClick={() => setIsCreatingSale(true)}
            className="fixed bottom-24 right-6 bg-brand-primary text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center z-20 hover:bg-blue-700 transition"
            aria-label="Create new sale"
        >
            <PlusCircleIcon className="w-10 h-10" />
        </button>
      )}
      
      {isCreatingSale && <SaleTypeSelectorModal />}

      <nav className="fixed bottom-0 left-0 right-0 bg-brand-header dark:bg-[#111827] border-t border-gray-200 dark:border-gray-700 grid grid-cols-4">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.name;
          return (
            <button 
              key={item.name} 
              onClick={() => handleNavClick(item.name)}
              className={`flex flex-col items-center justify-center w-full pt-2 pb-1 text-xs transition ${isActive ? 'text-brand-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
            >
              <Icon className="h-6 w-6 mb-1" />
              <span>{item.name}</span>
            </button>
          )
        })}
      </nav>
    </div>
  );
};

export default App;
