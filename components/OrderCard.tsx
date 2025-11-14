
import React from 'react';
import { Sale, Status, SaleType } from '../types';

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
  return (
    <div 
      className="bg-brand-surface dark:bg-[#374151] rounded-lg p-3 shadow-md hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer"
      onClick={() => onView(sale)}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-lg text-gray-900 dark:text-white">{sale.customerName}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">{sale.phoneType}</p>
        </div>
        <div className="text-right flex-shrink-0">
            {sale.saleType === SaleType.Repair && (
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusStyles[sale.status].bg} ${statusStyles[sale.status].text}`}>
                    {sale.status}
                </span>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{sale.saleType}</p>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
        <span>#{sale.receiptNumber}</span>
        <span>Kshs {sale.price.toLocaleString()}</span>
      </div>
    </div>
  );
});
