
import React, { useMemo, useState } from 'react';
import { Sale } from '../types';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { formatStandardDate, formatDisplayDate } from './dateFormatter';

const StatCard: React.FC<{ title: string; amount: number; color: string }> = ({ title, amount, color }) => (
    <div className={`bg-brand-header dark:bg-[#1F2937] p-4 rounded-lg shadow border-l-4 ${color}`}>
        <h2 className="text-gray-600 dark:text-gray-300 text-sm md:text-base">{title}</h2>
        <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-1">Kshs {new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}</p>
    </div>
);

type BreakdownData = {
    [key: string]: number;
};

type BreakdownView = 'daily' | 'monthly' | 'quarterly' | 'yearly';

const LineChart: React.FC<{ data: { [key: string]: number } }> = ({ data }) => {
    const labels = Object.keys(data);
    const values = Object.values(data) as number[];
    
    if (values.length < 2) {
        return <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg">Not enough data to draw a line graph. At least two data points are needed.</div>;
    }

    const width = 600;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 65, left: 60 };
    const boundedWidth = width - margin.left - margin.right;
    const boundedHeight = height - margin.top - margin.bottom;

    const maxValue = values.length > 0 ? Math.max(...values) : 0;
    const yAxisMax = Math.ceil(maxValue / 1000) * 1000 || 1000;

    const xScale = (index: number) => margin.left + (index / (values.length - 1)) * boundedWidth;
    const yScale = (value: number) => margin.top + boundedHeight - (value / yAxisMax) * boundedHeight;

    const pathData = values.map((value, index) => {
        const x = xScale(index);
        const y = yScale(value);
        return `${index === 0 ? 'M' : 'L'} ${x},${y}`;
    }).join(' ');

    const formatYLabel = (value: number) => {
        if (value >= 1000) return `${value / 1000}k`;
        return value;
    };
    
    const maxLabels = 10;
    const labelStep = Math.max(1, Math.ceil(labels.length / maxLabels));

    return (
        <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                {/* Y Axis Gridlines & Labels */}
                {[...Array(6)].map((_, i) => {
                    const y = margin.top + (i * boundedHeight / 5);
                    const value = yAxisMax - (i * yAxisMax / 5);
                    return (
                        <g key={i}>
                            <line x1={margin.left} y1={y} x2={width - margin.right} y2={y} className="stroke-current text-gray-200 dark:text-gray-700" strokeDasharray="2,2"/>
                            <text x={margin.left - 10} y={y + 3} textAnchor="end" className="text-xs fill-current text-gray-500 dark:text-gray-400">{formatYLabel(value)}</text>
                        </g>
                    );
                })}
                <line x1={margin.left} y1={margin.top} x2={margin.left} y2={height - margin.bottom} className="stroke-current text-gray-300 dark:text-gray-600" />


                {/* X Axis labels */}
                {labels.map((label, index) => {
                    if (index % labelStep !== 0) return null;
                    const x = xScale(index);
                    return (
                         <text key={label} x={x} y={height - margin.bottom + 25} textAnchor="middle" className="text-xs fill-current text-gray-500 dark:text-gray-400" transform={`rotate(-45, ${x}, ${height - margin.bottom + 25})`}>
                            {label}
                        </text>
                    );
                })}
                
                {/* Line */}
                <path d={pathData} fill="none" className="stroke-brand-primary" strokeWidth="2" />

                {/* Points */}
                {values.map((value, index) => (
                    <circle key={index} cx={xScale(index)} cy={yScale(value)} r="3" className="fill-brand-primary" />
                ))}
            </svg>
        </div>
    );
};


export const TotalSales: React.FC<{ sales: Sale[] }> = ({ sales }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [breakdownView, setBreakdownView] = useState<BreakdownView>('daily');
  const [activeRange, setActiveRange] = useState<string | null>(null);

  const setDateRange = (range: string) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (range) {
        case 'today':
            break;
        case 'thisweek':
            const currentDay = new Date(today);
            const firstDayOfWeek = new Date(currentDay.setDate(currentDay.getDate() - currentDay.getDay()));
            start = firstDayOfWeek;
            end = new Date(start);
            end.setDate(end.getDate() + 6);
            break;
        case 'thismonth':
            start = new Date(today.getFullYear(), today.getMonth(), 1);
            end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            break;
        case 'thisyear':
            start = new Date(today.getFullYear(), 0, 1);
            end = new Date(today.getFullYear(), 11, 31);
            break;
        default: return;
    }
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
    setActiveRange(range);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
    setActiveRange(null);
  };
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
    setActiveRange(null);
  };

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      if (!startDate && !endDate) return true;
      const saleDate = new Date(sale.receiptDate);
      if (startDate && new Date(startDate) > saleDate) return false;
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (end < saleDate) return false;
      }
      return true;
    });
  }, [sales, startDate, endDate]);

  const totals = useMemo(() => {
    const calculatedTotals = {
      grandTotal: 0,
      netTotal: 0,
      vat: 0,
      turnoverTax: 0,
    };

    filteredSales.forEach(sale => {
      calculatedTotals.grandTotal += sale.price;
    });

    calculatedTotals.netTotal = calculatedTotals.grandTotal / 1.16;
    calculatedTotals.vat = calculatedTotals.grandTotal - calculatedTotals.netTotal;
    calculatedTotals.turnoverTax = calculatedTotals.grandTotal * 0.01;

    return calculatedTotals;
  }, [filteredSales]);
  
  const breakdownData = useMemo(() => {
      const data: BreakdownData = {};
      
      const getQuarter = (d: Date) => Math.floor(d.getMonth() / 3) + 1;

      const sortedSales = [...filteredSales].sort((a,b) => new Date(a.receiptDate).getTime() - new Date(b.receiptDate).getTime());

      sortedSales.forEach(sale => {
          const date = new Date(sale.receiptDate);
          let key: string | null = null;
          let displayKey: string;

          switch(breakdownView) {
              case 'daily':
                  displayKey = formatStandardDate(date);
                  break;
              case 'monthly':
                  displayKey = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
                  break;
              case 'quarterly':
                  displayKey = `Q${getQuarter(date)} ${date.getFullYear()}`;
                  break;
              case 'yearly':
                  displayKey = `${date.getFullYear()}`;
                  break;
          }
          data[displayKey] = (data[displayKey] || 0) + sale.price;
      });
      
      return data;
  }, [filteredSales, breakdownView]);
  
  const headerTitle = useMemo(() => {
    switch(breakdownView) {
        case 'daily': return 'Day';
        case 'monthly': return 'Month';
        case 'quarterly': return 'Quarter';
        case 'yearly': return 'Year';
    }
  }, [breakdownView]);

  return (
    <div className="p-3 pb-24">
      <div className="flex items-center mb-6">
        <ChartBarIcon className="h-8 w-8 text-brand-primary mr-3" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Total Sales</h1>
      </div>
      
       <div className="mb-6 bg-brand-surface dark:bg-[#374151] p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">Filter by Date</h2>
            <div className="flex flex-wrap gap-2 mb-3">
                {['Today', 'This Week', 'This Month', 'This Year'].map(range => {
                    const rangeKey = range.toLowerCase().replace(' ', '');
                    return (
                        <button
                            key={rangeKey}
                            onClick={() => setDateRange(rangeKey)}
                            className={`px-3 py-1 text-sm font-medium rounded-full whitespace-nowrap transition ${
                                activeRange === rangeKey
                                    ? 'bg-brand-secondary text-white'
                                    : 'bg-brand-header dark:bg-[#1F2937] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-600'
                            }`}
                        >
                            {range}
                        </button>
                    )
                })}
            </div>
          <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                  <label htmlFor="totalSalesStartDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                  <input
                      type="date"
                      id="totalSalesStartDate"
                      value={startDate}
                      onChange={handleStartDateChange}
                      className="w-full bg-brand-header dark:bg-[#1F2937] border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-900 dark:text-white"
                  />
                  {startDate && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDisplayDate(startDate)}</p>}
              </div>
              <div className="flex-1">
                  <label htmlFor="totalSalesEndDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                  <input
                      type="date"
                      id="totalSalesEndDate"
                      value={endDate}
                      onChange={handleEndDateChange}
                      className="w-full bg-brand-header dark:bg-[#1F2937] border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-900 dark:text-white"
                  />
                  {endDate && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDisplayDate(endDate)}</p>}
              </div>
          </div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard title="Grand Total Sales" amount={totals.grandTotal} color="border-purple-500" />
        <StatCard title="Net Sales (Excl. VAT)" amount={totals.netTotal} color="border-gray-500" />
        <StatCard title="VAT Payable (16%)" amount={totals.vat} color="border-red-500" />
        <StatCard title="Turnover Tax (1%)" amount={totals.turnoverTax} color="border-yellow-500" />
      </div>

       <div className="bg-brand-surface dark:bg-[#374151] p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Sales Over Time</h2>
        <div className="flex space-x-1 sm:space-x-2 border-b border-gray-200 dark:border-gray-700 mb-4">
            {(['daily', 'monthly', 'quarterly', 'yearly'] as BreakdownView[]).map(view => (
                <button
                    key={view}
                    onClick={() => setBreakdownView(view)}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-t-lg capitalize transition focus:outline-none ${
                        breakdownView === view 
                        ? 'bg-brand-primary text-white' 
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                >
                    {view}
                </button>
            ))}
        </div>

        <div className="mb-6">
            {Object.keys(breakdownData).length > 0 ? (
                <LineChart data={breakdownData} />
             ) : (
                <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <p>No sales data for the selected period.</p>
                </div>
            )}
        </div>

        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Data Breakdown</h3>
        <div className="max-h-64 overflow-y-auto">
            {Object.keys(breakdownData).length > 0 ? (
                 <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="p-2 text-sm font-semibold text-gray-600 dark:text-gray-300">{headerTitle}</th>
                            <th className="p-2 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">Total Sales (Kshs)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(breakdownData).map(([period, amount]) => (
                            <tr key={period} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <td className="p-2 font-medium text-gray-900 dark:text-white">{period}</td>
                                <td className="p-2 font-mono text-gray-800 dark:text-gray-200 text-right">{new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount as number)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">No data to display.</p>
            )}
        </div>
      </div>
    </div>
  );
};
