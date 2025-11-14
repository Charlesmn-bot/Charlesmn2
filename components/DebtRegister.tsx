
import React, { useState, useMemo, useEffect } from 'react';
import { Sale, PaymentMethod } from '../types';
import { CashIcon } from './icons/CashIcon';
import { formatStandardDate } from './dateFormatter';

interface DebtRegisterProps {
  sales: Sale[];
  onUpdatePayment: (saleId: string, amount: number) => void;
  onViewSale: (sale: Sale) => void;
}

const AddPaymentModal: React.FC<{ sale: Sale; onSave: (amount: number) => void; onClose: () => void; }> = ({ sale, onSave, onClose }) => {
    const amountRemaining = sale.price - (sale.creditAmountPaid || 0);
    const [amount, setAmount] = useState(amountRemaining);

    const handleSave = () => {
        if (amount > 0 && amount <= amountRemaining) {
            onSave(amount);
        } else {
            alert(`Please enter a valid amount between 0 and ${amountRemaining}.`);
        }
    };
    
    const inputClasses = "w-full bg-brand-surface dark:bg-[#374151] border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-header dark:bg-[#111827] rounded-lg shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Add Payment</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Amount remaining: <span className="font-bold">Kshs {amountRemaining.toLocaleString()}</span></p>
            <div>
              <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Amount</label>
              <input
                id="paymentAmount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className={inputClasses}
                max={amountRemaining}
                min="0"
              />
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button onClick={onClose} className="px-4 py-2 bg-brand-surface dark:bg-[#374151] border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-blue-700 transition font-semibold">Save Payment</button>
            </div>
          </div>
        </div>
    )
}

const DebtCard: React.FC<{ debt: Sale; onAddPayment: () => void; onViewDetails: () => void }> = ({ debt, onAddPayment, onViewDetails }) => {
    const amountPaid = debt.creditAmountPaid || 0;
    const amountRemaining = debt.price - amountPaid;
    const progress = debt.price > 0 ? (amountPaid / debt.price) * 100 : 100;

    const isOverdue = debt.creditDueDate ? new Date(debt.creditDueDate) < new Date() : false;

    return (
        <div className="bg-brand-surface dark:bg-[#374151] rounded-lg p-3 shadow-md space-y-3">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-lg text-gray-900 dark:text-white">{debt.customerName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{debt.customerNumber}</p>
                    {debt.customerIdNumber && <p className="text-xs text-gray-500 dark:text-gray-400">ID: {debt.customerIdNumber}</p>}
                </div>
                <div className={`px-3 py-1 text-xs font-semibold rounded-full ${isOverdue ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'}`}>
                    {isOverdue ? 'Overdue' : 'Due'}
                </div>
            </div>
            <div onClick={onViewDetails} className="cursor-pointer">
                <p className="text-sm text-gray-600 dark:text-gray-300">Item: <span className="font-semibold">{debt.phoneType}</span></p>
                <div className="space-y-1 mt-2">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>Paid: Kshs {amountPaid.toLocaleString()}</span>
                        <span>Total: Kshs {debt.price.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
                <div className="mt-2 flex justify-between items-center">
                    <span className="font-bold text-lg text-red-500">Kshs {amountRemaining.toLocaleString()} <span className="text-sm font-normal">Remaining</span></span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Due: {debt.creditDueDate ? formatStandardDate(debt.creditDueDate) : 'N/A'}</span>
                </div>
            </div>
             <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                 <button onClick={onAddPayment} className="w-full text-center p-2 bg-brand-primary text-white font-bold rounded-md hover:bg-blue-700 transition">
                    Add Payment
                </button>
            </div>
        </div>
    );
};

export const DebtRegister: React.FC<DebtRegisterProps> = ({ sales, onUpdatePayment, onViewSale }) => {
  const [selectedDebt, setSelectedDebt] = useState<Sale | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const debts = useMemo(() => {
    return sales
      .filter(s => s.paymentMethod === PaymentMethod.Credit && !s.creditPaid)
      .filter(s => searchQuery === '' || 
        s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (s.customerNumber && s.customerNumber.includes(searchQuery)) ||
        (s.customerIdNumber && s.customerIdNumber.includes(searchQuery)))
      .sort((a, b) => {
          const dateA = a.creditDueDate ? new Date(a.creditDueDate).getTime() : 0;
          const dateB = b.creditDueDate ? new Date(b.creditDueDate).getTime() : 0;
          return dateA - dateB;
      });
  }, [sales, searchQuery]);
  
  useEffect(() => {
    const today = new Date();
    today.setHours(0,0,0,0);

    const overdueDebts = debts.filter(d => {
        if (!d.creditDueDate) return false;
        const dueDate = new Date(d.creditDueDate);
        dueDate.setHours(23, 59, 59, 999); // Due EOD
        return dueDate < today;
    });

    if (overdueDebts.length > 0) {
        const alerted = sessionStorage.getItem('overdue_alerted');
        if (!alerted) {
            const names = overdueDebts.map(d => `${d.customerName} (${d.customerNumber || 'N/A'})`).join(', ');
            alert(`Payment Reminder: The following customers have overdue payments: ${names}. Please follow up.`);
            sessionStorage.setItem('overdue_alerted', 'true');
        }
    }
  }, [debts]);
  
  const totalDebt = useMemo(() => {
      return debts.reduce((sum, debt) => sum + (debt.price - (debt.creditAmountPaid || 0)), 0);
  }, [debts]);

  const handleAddPayment = (saleId: string, amount: number) => {
    onUpdatePayment(saleId, amount);
    setSelectedDebt(null);
  };
  
  return (
    <div className="p-3 pb-24">
      {selectedDebt && <AddPaymentModal sale={selectedDebt} onClose={() => setSelectedDebt(null)} onSave={(amount) => handleAddPayment(selectedDebt.id, amount)} />}

      <div className="flex items-center mb-4">
        <CashIcon className="h-8 w-8 text-brand-primary mr-3" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Debt Register</h1>
      </div>
      
       <div className="mb-4">
            <input
            type="text"
            placeholder="Search by name, phone, or ID #"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-brand-surface dark:bg-[#374151] border border-gray-300 dark:border-gray-600 rounded-md p-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition"
            />
       </div>

      <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-lg shadow mb-6">
        <h2 className="text-red-800 dark:text-red-200 text-sm font-semibold">Total Outstanding Debt</h2>
        <p className="text-2xl font-bold text-red-900 dark:text-red-100 mt-1">Kshs {totalDebt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
      </div>

      {debts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {debts.map(debt => (
            <DebtCard 
                key={debt.id} 
                debt={debt} 
                onAddPayment={() => setSelectedDebt(debt)} 
                onViewDetails={() => onViewSale(debt)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500 dark:text-gray-400">No outstanding debts found.</p>
        </div>
      )}
    </div>
  );
};