
import React from 'react';
import { Sale, Status, SaleType, PaymentMethod } from '../types';
import { formatStandardDate } from './dateFormatter';

interface SaleCardProps {
  sale: Sale;
  onView: (sale: Sale) => void;
}

const statusStyles: { [key in Status]: { bg: string; text: string; } } = {
  [Status.Pending]: { bg: 'bg-status-pending', text: 'text-white' },
  [Status.InProgress]: { bg: 'bg-status-progress', text: 'text-white' },
  [Status.Completed]: { bg: 'bg-status-completed', text: 'text-white' },
  [Status.Collected]: { bg: 'bg-status-collected', text: 'text-white' },
};

export const SaleCard: React.FC<SaleCardProps> = React.memo(({ sale, onView }) => {
  const isCreditDue = sale.paymentMethod === PaymentMethod.Credit && !sale.creditPaid;
  
  const isOverdue = isCreditDue && sale.creditDueDate ? new Date(sale.creditDueDate) < new Date() : false;
  
  const daysOverdue = isOverdue && sale.creditDueDate
    ? Math.max(0, Math.floor((new Date().getTime() - new Date(sale.creditDueDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const amountRemaining = isCreditDue ? sale.price - (sale.creditAmountPaid || 0) : 0;


  return (
    <div 
      className="bg-brand-surface dark:bg-[#374151] rounded-lg p-3 shadow-md hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer flex flex-col justify-between"
      onClick={() => onView(sale)}
    >
      <div>
        <div className="flex justify-between items-start">
          <div>
            <p className="font-bold text-lg text-gray-900 dark:text-white">{sale.customerName}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">{sale.phoneType}</p>
          </div>
          <div className="text-right flex-shrink-0 space-y-1">
              {sale.saleType === SaleType.Repair && (
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusStyles[sale.status].bg} ${statusStyles[sale.status].text}`}>
                      {sale.status}
                  </span>
              )}
               {isCreditDue && (
                 <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${isOverdue ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'}`}>
                    {isOverdue ? 'Overdue' : 'Credit Due'}
                 </span>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 pt-1">{sale.saleType}</p>
          </div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center text-sm">
        <span className="text-gray-500 dark:text-gray-400">#{sale.receiptNumber}</span>
        {isCreditDue ? (
            <div className="text-right">
              <span className={`font-semibold ${isOverdue ? 'text-red-500' : 'text-yellow-600 dark:text-yellow-400'}`}>
                  Kshs {amountRemaining.toLocaleString()} left
              </span>
              {sale.creditDueDate && <span className="block text-xs text-gray-500">Due: {formatStandardDate(sale.creditDueDate)}</span>}
            </div>
        ) : (
            <span className="text-gray-800 dark:text-gray-200 font-semibold">Kshs {sale.price.toLocaleString()}</span>
        )}
      </div>
    </div>
  );
});