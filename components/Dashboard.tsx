import React, { useState, useMemo } from 'react';
import { Sale, Status, SaleType } from '../types';
import { SaleCard } from './OrderCard';
import { QrcodeIcon } from './icons/QrcodeIcon';
import { formatDisplayDate } from './dateFormatter';

interface SalesDashboardProps {
  sales: Sale[];
  onViewSale: (sale: Sale) => void;
  onOpenScanner: () => void;
}

const statusFilters: (Status | 'All')[] = ['All', Status.Pending, Status.InProgress, Status.Completed, Status.Collected];
const saleTypeFilters: (SaleType | 'All')[] = ['All', SaleType.Accessory, SaleType.Repair, SaleType.PhoneSale, SaleType.B2B_FundiShopSale, SaleType.Return];


export const Dashboard: React.FC<SalesDashboardProps> = ({ sales, onViewSale, onOpenScanner }) => {
  const [activeStatusFilter, setActiveStatusFilter] = useState<Status | 'All'>('All');
  const [activeTypeFilter, setActiveTypeFilter] = useState<SaleType | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const handleTypeFilterChange = (filter: SaleType | 'All') => {
    setActiveTypeFilter(filter);
    if (filter !== SaleType.Repair) {
        setActiveStatusFilter('All');
    }
  };

  const filteredSales = useMemo(() => {
    return sales
      .filter(sale => {
        const statusMatch = activeStatusFilter === 'All' || sale.status === activeStatusFilter;
        const typeMatch = activeTypeFilter === 'All' || sale.saleType === activeTypeFilter;
        const searchMatch = searchQuery === '' ||
          sale.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sale.receiptNumber.includes(searchQuery) ||
          sale.phoneType.toLowerCase().includes(searchQuery.toLowerCase());

        const dateMatch = (() => {
            if (!startDate && !endDate) return true;
            const saleDate = new Date(sale.dateBooked);
            if (startDate && new Date(startDate) > saleDate) return false;
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999); // Include the whole day
                if (end < saleDate) return false;
            }
            return true;
        })();
        
        if (activeTypeFilter === SaleType.Repair) {
            return typeMatch && statusMatch && searchMatch && dateMatch;
        }
        return typeMatch && searchMatch && dateMatch;
      })
      .sort((a, b) => new Date(b.dateBooked).getTime() - new Date(a.dateBooked).getTime());
  }, [sales, activeStatusFilter, activeTypeFilter, searchQuery, startDate, endDate]);

  return (
    <div className="p-3 pb-24">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Sales Dashboard</h1>

      <div className="mb-4 space-y-4">
        <div className="flex items-center space-x-2">
            <input
            type="text"
            placeholder="Search by name, phone, or receipt #"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-brand-surface dark:bg-[#374151] border border-gray-300 dark:border-gray-600 rounded-md p-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition"
            />
            <button 
                onClick={onOpenScanner} 
                className="p-3 bg-brand-surface dark:bg-[#374151] border border-gray-300 dark:border-gray-600 rounded-md text-brand-primary hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                aria-label="Scan QR Code"
            >
                <QrcodeIcon className="h-6 w-6" />
            </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-brand-surface dark:bg-[#374151] border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-900 dark:text-white"
                />
                {startDate && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDisplayDate(startDate)}</p>}
            </div>
            <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-brand-surface dark:bg-[#374151] border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-900 dark:text-white"
                />
                {endDate && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDisplayDate(endDate)}</p>}
            </div>
        </div>
      </div>
      
      <div className="mb-4 space-y-3">
        <div className="flex space-x-2 overflow-x-auto pb-2">
            {saleTypeFilters.map(filter => (
            <button
                key={filter}
                onClick={() => handleTypeFilterChange(filter)}
                className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition ${
                activeTypeFilter === filter
                    ? 'bg-brand-primary text-white'
                    : 'bg-brand-surface dark:bg-[#374151] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
            >
                {filter}
            </button>
            ))}
        </div>
        {activeTypeFilter === SaleType.Repair && (
            <div className="flex space-x-2 overflow-x-auto pb-2">
                {statusFilters.map(filter => (
                <button
                    key={filter}
                    onClick={() => setActiveStatusFilter(filter)}
                    className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition ${
                    activeStatusFilter === filter
                        ? 'bg-brand-primary text-white'
                        : 'bg-brand-surface dark:bg-[#374151] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                >
                    {filter}
                </button>
                ))}
            </div>
        )}
      </div>


      {filteredSales.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredSales.map(sale => (
            <SaleCard key={sale.id} sale={sale} onView={onViewSale} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500 dark:text-gray-400">No sales found for the current filters.</p>
        </div>
      )}
    </div>
  );
};
