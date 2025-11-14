import React, { useState, useCallback, useEffect } from 'react';
import { Sale, Status, SaleType, PaymentMethod, Technician, Supplier, Purchase, CustomerServiceRepresentative, User } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { STORE_NAME } from './constants';
import * as XLSX from 'xlsx';

import { Dashboard } from './components/Dashboard';
import { OrderForm as SaleForm } from './components/OrderForm';
import { Scanner } from './components/Scanner';
import { Settings } from './components/Settings';
import { Receipt } from './components/Receipt';
import { Login } from './components/Login';
import { Suppliers } from './components/Suppliers';
import { TotalSales } from './components/TotalSales';
import { DebtRegister } from './components/DebtRegister';

import { ClipboardListIcon } from './components/icons/ClipboardListIcon';
import { PlusCircleIcon } from './components/icons/PlusCircleIcon';
import { CogIcon } from './components/icons/CogIcon';
import { TruckIcon } from './components/icons/TruckIcon';
import { ChartBarIcon } from './components/icons/ChartBarIcon';
import { CashIcon } from './components/icons/CashIcon';

type Tab = 'Sales' | 'Suppliers' | 'Totals' | 'Settings' | 'Debts';
type View = 'list' | 'form' | 'receipt' | 'scanner';

const initialUsers: User[] = [
  { id: 'user-1', username: 'Admin', password: 'Admin123', role: 'Admin' },
  { id: 'user-2', username: 'Cashier', password: 'Cashier123', role: 'Cashier' },
];

const initialTechnicians: Technician[] = [
    { id: '1', name: 'Harrison' }, { id: '2', name: 'Amon' }, { id: '3', name: 'KamJay' },
    { id: '4', name: 'Saidy' }, { id: '5', name: 'John' }, { id: '6', name: 'Charles' }, { id: '7', name: 'Njoro' },
];

const initialCsrs: CustomerServiceRepresentative[] = [ { id: 'csr-a1b2', name: 'Alice' }, { id: 'csr-c3d4', name: 'Bob' } ];
const initialSuppliers: Supplier[] = [ { id: 'sup1', name: 'Phone Parts Inc', contact: '0712345678' }, { id: 'sup2', name: 'Accessory World', contact: '0787654321' } ];
const initialPurchases: Purchase[] = [ { id: 'pur1', supplierId: 'sup1', product: 'iPhone 13 Screens', cost: 12000, quantity: 5, totalCost: 60000, date: '2023-10-20' }, { id: 'pur2', supplierId: 'sup2', product: 'Samsung Chargers', cost: 500, quantity: 20, totalCost: 10000, date: '2023-10-22' } ];
const initialSales: Sale[] = [ { id: '1', receiptNumber: 'GSM-0001', customerName: 'John Doe', phoneType: 'iPhone 13 Pro', saleType: SaleType.Repair, repairType: 'Screen Replacement', price: 15000, assignedTechnician: '1', storageLocation: 'A1', notes: 'Customer waiting.', dateBooked: '2023-10-26T10:00:00Z', receiptDate: '2023-10-26T10:00:00Z', status: Status.Completed, paymentMethod: PaymentMethod.Mpesa, mpesaNumber: '254712345678' }, { id: '2', receiptNumber: 'GSM-0002', customerName: 'Jane Smith', phoneType: 'Samsung S22 Ultra', saleType: SaleType.Repair, repairType: 'Battery Replacement', price: 8500, assignedTechnician: '2', storageLocation: 'A2', notes: '', dateBooked: '2023-10-27T11:30:00Z', receiptDate: '2023-10-27T11:30:00Z', status: Status.InProgress, paymentMethod: PaymentMethod.Cash }, { id: '3', receiptNumber: 'GSM-0003', customerName: 'Peter Jones', phoneType: 'Type-C Cable', saleType: SaleType.Accessory, price: 800, unitPrice: 800, quantity: 1, notes: 'Fast charging model', dateBooked: '2023-10-28T14:00:00Z', receiptDate: '2023-10-28T14:00:00Z', status: Status.Completed, paymentMethod: PaymentMethod.Cash } ];

const App: React.FC = () => {
  const [users, setUsers] = useLocalStorage<User[]>('gsm-users', initialUsers);
  const [currentUser, setCurrentUser] = useLocalStorage<Omit<User, 'password'> | null>('gsm-pos-user', null);
  const [loginError, setLoginError] = useState<string | null>(null);

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
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  // FIX: Corrected typo in function signature from 'password; string' to 'password: string'. This was causing a cascade of scope-related errors.
  const handleLogin = (username: string, password: string) => {
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    if (user) {
      const { password: _password, ...userToStore } = user;
      setCurrentUser(userToStore);
      setLoginError(null);
      setActiveTab('Sales'); // Default to sales tab on login
    } else {
      setLoginError('Invalid username or password.');
    }
  };
  const handleLogout = () => setCurrentUser(null);

  const handleSaveSale = (sale: Sale) => {
    setSales(prev => {
      const index = prev.findIndex(o => o.id === sale.id);
      if (index > -1) {
        const newSales = [...prev];
        newSales[index] = sale;
        return newSales;
      }
      return [...prev, sale];
    });
    resetView();
    setActiveTab('Sales');
  };
  
  const handleDeleteSale = (saleId: string) => {
    setSales(prev => prev.filter(s => s.id !== saleId));
    resetView();
  };

  const handleViewSale = useCallback((sale: Sale) => { setSelectedSale(sale); setCurrentView('receipt'); }, []);
  const handleEditSale = useCallback((sale: Sale) => { setSelectedSale(sale); setSaleTypeToCreate(sale.saleType); setCurrentView('form'); }, []);

  const handleUpdateCreditPayment = useCallback((saleId: string, paymentAmount: number) => {
    setSales(prev => prev.map(s => {
      if (s.id === saleId) {
        const newPaidAmount = (s.creditAmountPaid || 0) + paymentAmount;
        const isPaid = newPaidAmount >= s.price;
        const updatedSale = { ...s, creditAmountPaid: newPaidAmount, creditPaid: isPaid, creditPaidDate: isPaid ? new Date().toISOString() : s.creditPaidDate };
        if (selectedSale?.id === saleId) setSelectedSale(updatedSale);
        return updatedSale;
      }
      return s;
    }));
  }, [selectedSale]);

  const handleScan = useCallback((saleId: string) => {
    const foundSale = sales.find(o => o.id === saleId);
    if (foundSale) handleViewSale(foundSale); else alert(`Sale with ID ${saleId} not found.`);
    resetView(); setActiveTab('Sales');
  }, [sales, handleViewSale]);
  
  const getNewReceiptNumber = useCallback(() => {
    const lastNum = sales.reduce((max, s) => Math.max(max, parseInt(s.receiptNumber.split('-')[1]) || 0), 0);
    return `GSM-${(lastNum + 1).toString().padStart(4, '0')}`;
  }, [sales]);
  
  const resetView = () => { setCurrentView('list'); setSelectedSale(null); setIsCreatingSale(false); setSaleTypeToCreate(null); };
  
  const handleOpenScanner = useCallback(() => setCurrentView('scanner'), []);

  // --- Staff & User CRUD ---
  const addTechnician = (name: string) => setTechnicians(prev => [...prev, { id: crypto.randomUUID(), name }]);
  const updateTechnician = (tech: Technician) => setTechnicians(prev => prev.map(t => t.id === tech.id ? tech : t));
  const deleteTechnician = (id: string) => setTechnicians(prev => prev.filter(t => t.id !== id));
  
  const addCsr = (name: string) => setCsrs(prev => [...prev, { id: crypto.randomUUID(), name }]);
  const updateCsr = (csr: CustomerServiceRepresentative) => setCsrs(prev => prev.map(c => c.id === csr.id ? csr : c));
  const deleteCsr = (id: string) => setCsrs(prev => prev.filter(c => c.id !== id));
  
  const addUser = (user: Omit<User, 'id'>) => new Promise<void>((resolve, reject) => {
    if (users.some(u => u.username.toLowerCase() === user.username.toLowerCase())) { reject(new Error('Username already exists.')); return; }
    setUsers(prev => [...prev, { ...user, id: crypto.randomUUID() }]); resolve();
  });
  const updateUser = (user: User) => new Promise<void>((resolve) => {
    setUsers(prev => prev.map(u => u.id === user.id ? user : u)); resolve();
  });
  const deleteUser = (id: string) => setUsers(prev => prev.filter(u => u.id !== id));

  const addSupplier = (s: Omit<Supplier, 'id'>) => setSuppliers(prev => [...prev, { ...s, id: crypto.randomUUID() }]);
  const updateSupplier = (s: Supplier) => setSuppliers(prev => prev.map(sup => sup.id === s.id ? s : sup));
  const deleteSupplier = (id: string) => setSuppliers(prev => prev.filter(s => s.id !== id));

  const addPurchase = (p: Omit<Purchase, 'id'>) => setPurchases(prev => [...prev, { ...p, id: crypto.randomUUID() }]);
  const updatePurchase = (p: Purchase) => setPurchases(prev => prev.map(pur => pur.id === p.id ? p : pur));
  const deletePurchase = (id: string) => setPurchases(prev => prev.filter(pur => pur.id !== id));

  const handleExportData = useCallback((type: 'sales' | 'purchases' | 'suppliers' | 'technicians' | 'csrs') => {
    const dataMap = { sales, purchases, suppliers, technicians, csrs };
    const data = dataMap[type];
    if (data.length === 0) { alert(`No data for ${type} to export.`); return; }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, type.charAt(0).toUpperCase() + type.slice(1));
    XLSX.writeFile(wb, `GSM_${type}_Data.xlsx`);
  }, [sales, purchases, suppliers, technicians, csrs]);

  const handleImportData = (file: File) => new Promise<void>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: 'array', cellDates: true });
        const update = <T extends {id: string}>(sheet: string, current: T[], set: React.Dispatch<React.SetStateAction<T[]>>, fields: (keyof T)[]) => {
          if (!wb.Sheets[sheet]) return;
          const json = XLSX.utils.sheet_to_json<any>(wb.Sheets[sheet]);
          const map = new Map(current.map(i => [i.id, i]));
          json.forEach(row => {
            if(fields.some(f => row[f] === undefined)) return;
            map.set(row.id || crypto.randomUUID(), { ...map.get(row.id), ...row });
          });
          set(Array.from(map.values()));
        };
        update('Sales', sales, setSales, ['customerName', 'saleType', 'price', 'dateBooked']);
        update('Purchases', purchases, setPurchases, ['supplierId', 'product', 'cost', 'quantity', 'date']);
        update('Suppliers', suppliers, setSuppliers, ['name', 'contact']);
        update('Technicians', technicians, setTechnicians, ['name']);
        update('CSRs', csrs, setCsrs, ['name']);
        resolve();
      } catch (err) { reject(new Error("File is corrupted or not in the expected format.")); }
    };
    reader.onerror = () => reject(new Error("Failed to read the file."));
    reader.readAsArrayBuffer(file);
  });
  
  if (!currentUser) { return <Login onLogin={handleLogin} loginError={loginError} />; }

  const renderContent = () => {
    if (currentView === 'receipt' && selectedSale) return <Receipt sale={selectedSale} onClose={resetView} onEdit={handleEditSale} onDelete={handleDeleteSale} technicians={technicians} currentUser={currentUser} allSales={sales} onUpdateCreditPayment={handleUpdateCreditPayment} />;
    if (currentView === 'form' && (saleTypeToCreate || selectedSale)) return <SaleForm saleType={selectedSale?.saleType || saleTypeToCreate!} saleToEdit={selectedSale} onSave={handleSaveSale} onCancel={resetView} getNewReceiptNumber={getNewReceiptNumber} technicians={technicians} purchases={purchases}/>;
    if (currentView === 'scanner') return <Scanner onScan={handleScan} onClose={resetView} />;
    
    switch (activeTab) {
      case 'Sales': return <Dashboard sales={sales} onViewSale={handleViewSale} onOpenScanner={handleOpenScanner} />;
      case 'Debts': return <DebtRegister sales={sales} onUpdatePayment={handleUpdateCreditPayment} onViewSale={handleViewSale} />;
      case 'Suppliers': return <Suppliers suppliers={suppliers} purchases={purchases} onAddSupplier={addSupplier} onUpdateSupplier={updateSupplier} onDeleteSupplier={deleteSupplier} onAddPurchase={addPurchase} onUpdatePurchase={updatePurchase} onDeletePurchase={deletePurchase} />;
      case 'Totals': return <TotalSales sales={sales} />;
      case 'Settings': return <Settings onLogout={handleLogout} technicians={technicians} onAddTechnician={addTechnician} onUpdateTechnician={updateTechnician} onDeleteTechnician={deleteTechnician} csrs={csrs} onAddCsr={addCsr} onUpdateCsr={updateCsr} onDeleteCsr={deleteCsr} theme={theme} toggleTheme={toggleTheme} currentUser={currentUser} users={users} onAddUser={addUser} onUpdateUser={updateUser} onDeleteUser={deleteUser} onExportData={handleExportData} onImportData={handleImportData} />;
      default: return <Dashboard sales={sales} onViewSale={handleViewSale} onOpenScanner={handleOpenScanner} />;
    }
  };

  const navItems = [
    { name: 'Sales' as Tab, icon: ClipboardListIcon, roles: ['Admin', 'Cashier'] },
    { name: 'Totals' as Tab, icon: ChartBarIcon, roles: ['Admin'] },
    { name: 'Debts' as Tab, icon: CashIcon, roles: ['Admin'] },
    { name: 'Suppliers' as Tab, icon: TruckIcon, roles: ['Admin'] },
    { name: 'Settings' as Tab, icon: CogIcon, roles: ['Admin', 'Cashier'] },
  ];
  const visibleNavItems = navItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <div className="min-h-screen bg-brand-bg dark:bg-[#1F2937] font-sans">
      <header className="bg-brand-header dark:bg-[#111827] p-3 shadow-md sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800">
        <div className="flex justify-center items-center relative"><h1 className="text-xl font-bold text-gray-900 dark:text-white text-center">{STORE_NAME}</h1>
          {currentUser && (
            <div className="absolute right-0 text-right pr-2">
              <p className="font-semibold text-sm text-gray-900 dark:text-white">{currentUser.username}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser.role}</p>
            </div>
          )}
        </div>
      </header>
      <main className="pb-20 text-gray-800 dark:text-gray-200">{renderContent()}</main>

      {activeTab === 'Sales' && currentView === 'list' && (
        <button onClick={() => setIsCreatingSale(true)} className="fixed bottom-24 right-6 bg-brand-primary text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center z-20 hover:bg-blue-700 transition" aria-label="Create new sale"><PlusCircleIcon className="w-10 h-10" /></button>
      )}
      
      {isCreatingSale && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
              <div className="bg-brand-header dark:bg-[#111827] rounded-lg shadow-xl p-6 w-full max-w-sm space-y-4">
                   <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white">Select Sale Type</h2>
                   {Object.values(SaleType).map(type => (<button key={type} onClick={() => { setSaleTypeToCreate(type); setIsCreatingSale(false); setCurrentView('form'); }} className="w-full text-left p-4 bg-brand-surface dark:bg-[#374151] hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition text-gray-900 dark:text-white font-semibold">{type}</button>))}
                   <button onClick={() => setIsCreatingSale(false)} className="w-full mt-2 p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-800 rounded-md transition">Cancel</button>
              </div>
          </div>
      )}

      <nav className={`fixed bottom-0 left-0 right-0 bg-brand-header dark:bg-[#111827] border-t border-gray-200 dark:border-gray-700 grid grid-cols-${visibleNavItems.length}`}>
        {visibleNavItems.map(item => (<button key={item.name} onClick={() => { setActiveTab(item.name); resetView(); }} className={`flex flex-col items-center justify-center w-full pt-2 pb-1 text-xs transition ${activeTab === item.name ? 'text-brand-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}><item.icon className="h-6 w-6 mb-1" /><span>{item.name}</span></button>))}
      </nav>
    </div>
  );
};

export default App;
