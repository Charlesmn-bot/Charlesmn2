import React, { useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Sale, Status, SaleType, Technician, PaymentMethod, User } from '../types';
import { STORE_NAME, STORE_WHATSAPP_NUMBER } from '../constants';
import { formatStandardDate, formatPrintDate, formatFullDateTime } from './dateFormatter';

interface ReceiptProps {
  sale: Sale;
  onClose: () => void;
  onEdit: (sale: Sale) => void;
  technicians: Technician[];
  currentUser: User | null;
  allSales: Sale[];
  onUpdateCreditPayment: (saleId: string, amount: number) => void;
}

const statusColorMap: { [key in Status]: string } = {
  [Status.Pending]: 'text-status-pending',
  [Status.InProgress]: 'text-status-progress',
  [Status.Completed]: 'text-status-completed',
  [Status.Collected]: 'text-status-collected',
};

const AddPaymentModal: React.FC<{ sale: Sale; onSave: (amount: number) => void; onClose: () => void; }> = ({ sale, onSave, onClose }) => {
    const amountRemaining = sale.price - (sale.creditAmountPaid || 0);
    const [amount, setAmount] = useState(amountRemaining);

    const handleSave = () => {
        if (amount > 0 && amount <= amountRemaining) {
            onSave(amount);
            onClose();
        } else {
            alert(`Please enter a valid amount between 0 and ${amountRemaining}.`);
        }
    };
    
    const inputClasses = "w-full bg-brand-surface dark:bg-[#374151] border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[60] p-4">
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

export const Receipt: React.FC<ReceiptProps> = ({ sale, onClose, onEdit, technicians, currentUser, allSales, onUpdateCreditPayment }) => {
  const cashierName = currentUser?.username || 'N/A';
  const isCreditSale = sale.paymentMethod === PaymentMethod.Credit;
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);

  const customerDebt = useMemo(() => {
      if (!sale.customerName) return 0;
      return allSales
          .filter(s => s.customerName === sale.customerName && s.paymentMethod === PaymentMethod.Credit && !s.creditPaid)
          .reduce((total, s) => total + (s.price - (s.creditAmountPaid || 0)), 0);
  }, [allSales, sale.customerName]);

  const daysOverdue = useMemo(() => {
    if (isCreditSale && !sale.creditPaid && sale.creditDueDate) {
        const dueDate = new Date(sale.creditDueDate);
        const today = new Date();
        dueDate.setHours(23, 59, 59, 999); // Due at end of day
        today.setHours(0, 0, 0, 0);
        if (dueDate < today) {
            return Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        }
    }
    return 0;
  }, [sale]);

  const getTechnicianName = (techId?: string) => {
    if(!techId) return 'N/A';
    return technicians.find(t => t.id === techId)?.name || 'Unknown';
  }

  const handlePrint = () => {
    window.print();
  };

  const getReceiptText = () => {
    let text = `*${STORE_NAME}*\n\n` +
           `*Receipt #: ${sale.receiptNumber}*\n` +
           `--------------------------\n` +
           `Customer: ${sale.customerName}\n`;
    if (sale.customerNumber) text += `Phone: ${sale.customerNumber}\n`;
    
    text += `Item: ${sale.phoneType}\n` +
            `Sale Type: ${sale.saleType}\n`;

    if (sale.saleType === SaleType.Repair) {
        text += `Repair Details: ${sale.repairType}\n` +
                `Technician: ${getTechnicianName(sale.assignedTechnician)}\n` +
                `Status: *${sale.status}*\n`;
    }
    
    text += `Date Booked: ${formatStandardDate(sale.dateBooked)}\n` +
           `--------------------------\n` +
           `*Total: Kshs ${sale.price.toLocaleString()}*\n` +
           `Payment Method: ${sale.paymentMethod}\n`;

    if(isCreditSale) {
      if (!sale.creditPaid) {
        text += `Amount Paid: Kshs ${(sale.creditAmountPaid || 0).toLocaleString()}\n`;
        text += `*Amount Due: Kshs ${(sale.price - (sale.creditAmountPaid || 0)).toLocaleString()}*\n`;
        text += `Due Date: ${sale.creditDueDate ? formatStandardDate(sale.creditDueDate) : 'N/A'}\n`;
        if (daysOverdue > 0) {
            text += `Status: *OVERDUE* (${daysOverdue} days)\n`;
        } else {
            text += `Status: *CREDIT DUE*\n`;
        }
      } else {
        text += `Status: *PAID IN FULL*\n`;
      }
    }
           
    text += `--------------------------\n` +
           `Thank you for your business!`;
    return text;
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(getReceiptText());
    const customerPhone = sale.customerNumber || sale.mpesaNumber || '';
    const storePhone = STORE_WHATSAPP_NUMBER;
    
    if(customerPhone) {
        window.open(`https://wa.me/${customerPhone.replace(/^0+/, '254')}?text=${text}`, '_blank');
    } else {
        alert("No customer phone number available for WhatsApp sharing.");
    }
    setTimeout(() => {
        window.open(`https://wa.me/${storePhone}?text=${text}`, '_blank');
    }, 500);
  };
  
  return (
    <>
    {isPaymentModalOpen && <AddPaymentModal sale={sale} onClose={() => setPaymentModalOpen(false)} onSave={(amount) => onUpdateCreditPayment(sale.id, amount)} />}
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 print:bg-white">
      <div className="bg-brand-bg dark:bg-[#1F2937] w-full max-w-sm rounded-lg shadow-xl overflow-y-auto max-h-full print:bg-white print:text-black print:shadow-none">
        <div className="p-5 text-gray-800 dark:text-gray-200">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold print:text-black text-gray-900 dark:text-white">{STORE_NAME}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 print:text-gray-700">Mobile Phone Repair & Accessories</p>
          </div>
          
          <div className="my-6 border-t-2 border-dashed border-gray-300 dark:border-gray-500 print:border-gray-400"></div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="font-semibold">Receipt #:</span><span>{sale.receiptNumber}</span></div>
            <div className="flex justify-between"><span className="font-semibold">Cashier:</span><span>{cashierName}</span></div>
            <div className="flex justify-between">
                <span className="font-semibold">Date:</span>
                <span>
                    <span className="print:hidden">{formatFullDateTime(sale.receiptDate)}</span>
                    <span className="hidden print:inline">{formatPrintDate(sale.receiptDate)}</span>
                </span>
            </div>
            <div className="flex justify-between"><span className="font-semibold">Customer:</span><span className="text-right">{sale.customerName}</span></div>
            {customerDebt > 0 && !sale.creditPaid && (
                <div className="flex justify-between text-red-500 font-semibold mt-1">
                    <span>Total Outstanding:</span>
                    <span>Kshs {customerDebt.toLocaleString()}</span>
                </div>
            )}
             {sale.saleType === SaleType.Repair && (
                <div className={`flex justify-between font-bold text-lg ${statusColorMap[sale.status]}`}><span className="font-semibold">Status:</span><span>{sale.status}</span></div>
             )}
          </div>

          <div className="my-6 border-t border-dashed border-gray-300 dark:border-gray-500 print:border-gray-400"></div>

          <div className="space-y-2 text-sm">
            <p className="font-bold">Sale Details:</p>
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400 print:text-gray-700">{sale.saleType === SaleType.Accessory ? 'Accessory' : 'Item'}:</span><span className="text-right">{sale.phoneType}</span></div>
            <div className="flex justify-between"><span className="font-semibold print:text-gray-700">Sale Type:</span><span className="text-right">{sale.saleType}</span></div>
            {sale.saleType === SaleType.Repair && sale.repairType && <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400 print:text-gray-700">Repair:</span><span className="text-right">{sale.repairType}</span></div>}
            {sale.saleType === SaleType.Repair && <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400 print:text-gray-700">Technician:</span><span className="text-right">{getTechnicianName(sale.assignedTechnician)}</span></div>}
            {sale.saleType !== SaleType.Accessory && <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400 print:text-gray-700">Storage:</span><span className="text-right">{sale.storageLocation || 'N/A'}</span></div>}
          </div>
          
          <div className="my-6 border-t border-dashed border-gray-300 dark:border-gray-500 print:border-gray-400"></div>
          
          <div className="space-y-2 text-sm">
             <div className="flex justify-between text-xl font-bold"><span className="">Total:</span><span>Kshs {sale.price.toLocaleString()}</span></div>
             <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400 print:text-gray-700">Payment:</span><span>{sale.paymentMethod}</span></div>
             {isCreditSale && (
                !sale.creditPaid ? (
                    <div className="text-right p-2 bg-red-100 dark:bg-red-900/30 rounded-md mt-1 space-y-1">
                        <div className="flex justify-between text-gray-600 dark:text-gray-300"><span>Amount Paid:</span><span>Kshs {(sale.creditAmountPaid || 0).toLocaleString()}</span></div>
                        <div className="flex justify-between font-bold text-red-600 dark:text-red-400"><span>Amount Remaining:</span><span>Kshs {(sale.price - (sale.creditAmountPaid || 0)).toLocaleString()}</span></div>
                        <div className="flex justify-between text-sm text-red-500 dark:text-red-500"><span>Due Date:</span><span>{sale.creditDueDate ? formatStandardDate(sale.creditDueDate) : 'N/A'}</span></div>
                        {daysOverdue > 0 && <p className="font-bold text-red-600 dark:text-red-400 text-center uppercase pt-1">Overdue by {daysOverdue} days</p>}
                    </div>
                ) : (
                    <div className="text-right p-2 bg-green-100 dark:bg-green-900/30 rounded-md mt-1">
                        <p className="font-bold text-green-600 dark:text-green-400">PAID IN FULL</p>
                        {sale.creditPaidDate && <p className="text-sm text-green-500 dark:text-green-500">on {formatStandardDate(sale.creditPaidDate)}</p>}
                    </div>
                )
            )}
             {sale.paymentMethod === PaymentMethod.Mpesa && sale.mpesaNumber && (
                <div className="flex justify-between pl-4"><span className="text-gray-500 dark:text-gray-400 print:text-gray-700">M-Pesa No:</span><span>{sale.mpesaNumber}</span></div>
             )}
            {sale.paymentMethod === PaymentMethod.LipaMdogoMdogo && (
                <>
                    <div className="flex justify-between pl-4"><span className="text-gray-500 dark:text-gray-400 print:text-gray-700">Plan:</span><span>{sale.lipaMdogoMdogoPlan}</span></div>
                    <div className="flex justify-between pl-4"><span className="text-gray-500 dark:text-gray-400 print:text-gray-700">Installment:</span><span>Kshs {sale.lipaMdogoMdogoAmount?.toLocaleString()}</span></div>
                </>
            )}
            {sale.paymentMethod === PaymentMethod.Onfone && sale.onfoneTransactionId && (
                <div className="flex justify-between pl-4"><span className="text-gray-500 dark:text-gray-400 print:text-gray-700">Trans. ID:</span><span className="truncate">{sale.onfoneTransactionId}</span></div>
            )}
          </div>
          
          <div className="mt-8 flex justify-center">
             <QRCodeSVG value={sale.id} size={128} bgColor="#ffffff" fgColor="#000000" />
          </div>
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 print:text-gray-700 mt-2">Scan to check sale status</p>
        </div>

        <div className="p-3 bg-brand-surface dark:bg-[#374151] space-y-2 print:hidden">
            {isCreditSale && !sale.creditPaid && (
              <button onClick={() => setPaymentModalOpen(true)} className="w-full bg-green-600 text-white py-3 rounded-md font-bold hover:bg-green-700 transition">Manage Payment</button>
            )}
            {currentUser?.role === 'Admin' && (
              <button onClick={() => onEdit(sale)} className="w-full bg-brand-secondary text-white py-3 rounded-md font-bold hover:bg-orange-600 transition">Edit Sale</button>
            )}
            <button onClick={handlePrint} className="w-full bg-brand-primary text-white py-3 rounded-md font-bold hover:bg-blue-700 transition">Print Receipt</button>
            <button onClick={handleWhatsAppShare} className="w-full bg-green-500 text-white py-3 rounded-md font-bold hover:bg-green-600 transition">Share on WhatsApp</button>
            <button onClick={onClose} className="w-full bg-gray-500 dark:bg-gray-600 text-white py-3 rounded-md font-bold hover:bg-gray-600 dark:hover:bg-gray-700 transition">Close</button>
        </div>
      </div>
       <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .fixed > div {
             max-width: 100% !important;
             max-height: 100% !important;
          }
          .fixed > div, .fixed > div * {
            visibility: visible;
          }
          .fixed {
            position: absolute;
            left: 0;
            top: 0;
          }
        }
      `}</style>
    </div>
    </>
  );
};
