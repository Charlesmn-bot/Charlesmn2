import React, { useState, useEffect, useMemo } from 'react';
import { Sale, SaleType, PaymentMethod, Status, Technician, Purchase } from '../types';
import { ACCESSORY_PRODUCTS, REPAIR_TYPES, PHONE_MODELS_BY_BRAND } from '../constants';

const REPAIR_TIME_OPTIONS = ['30 Min', '45 Min', '1 hr', '2 hrs', '1 day', '2 days', '3 days'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

interface SaleFormProps {
  saleToEdit?: Sale | null;
  onSave: (sale: Sale) => void;
  onCancel: () => void;
  getNewReceiptNumber: () => string;
  technicians: Technician[];
  saleType: SaleType;
  purchases: Purchase[];
}

export const OrderForm: React.FC<SaleFormProps> = ({ saleToEdit, onSave, onCancel, getNewReceiptNumber, technicians, saleType, purchases }) => {
  const [sale, setSale] = useState<Partial<Sale>>({
    customerName: '',
    customerNumber: '',
    phoneType: '',
    phoneModel: '',
    saleType: saleType,
    repairType: '',
    price: 0,
    assignedTechnician: technicians[0]?.id || '',
    estimatedRepairTime: '',
    storageLocation: '',
    notes: '',
    dateBooked: new Date().toISOString().split('T')[0],
    status: saleType === SaleType.Repair ? Status.Pending : Status.Completed,
    paymentMethod: PaymentMethod.Cash,
    receivedInShop: true,
  });
  const [imeiPhotoPreview, setImeiPhotoPreview] = useState<string | undefined>(undefined);
  const [devicePhotoPreview, setDevicePhotoPreview] = useState<string | undefined>(undefined);
  const [fileErrors, setFileErrors] = useState<{ imeiPhoto?: string; devicePhoto?: string }>({});
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [otherItemName, setOtherItemName] = useState('');
  const [otherRepair, setOtherRepair] = useState('');

  const sparePartsList = useMemo(() => {
    const parts = new Set<string>();
    purchases.forEach(p => parts.add(p.product));
    return Array.from(parts).sort();
  }, [purchases]);

  useEffect(() => {
    if (saleToEdit) {
      const saleData = { ...saleToEdit };
      
      if (saleToEdit.saleType === SaleType.Accessory && !ACCESSORY_PRODUCTS.includes(saleToEdit.phoneType)) {
        saleData.phoneType = 'Other';
        setOtherItemName(saleToEdit.phoneType);
      } else if (saleToEdit.saleType === SaleType.B2B_FundiShopSale && !sparePartsList.includes(saleToEdit.phoneType)) {
        saleData.phoneType = 'Other';
        setOtherItemName(saleToEdit.phoneType);
      } else {
        setOtherItemName('');
      }

      if (saleToEdit.saleType === SaleType.Repair && saleToEdit.repairType && !REPAIR_TYPES.includes(saleToEdit.repairType)) {
        saleData.repairType = 'Other';
        setOtherRepair(saleToEdit.repairType);
      } else {
        setOtherRepair('');
      }
      
      setSale(saleData);
      setImeiPhotoPreview(saleToEdit.imeiPhoto);
      setDevicePhotoPreview(saleToEdit.devicePhoto);
    }
  }, [saleToEdit, sparePartsList]);

  useEffect(() => {
    const isPhoneSale = sale.saleType === SaleType.Repair || sale.saleType === SaleType.PhoneSale;
    if (isPhoneSale && sale.phoneType && PHONE_MODELS_BY_BRAND[sale.phoneType as keyof typeof PHONE_MODELS_BY_BRAND]) {
        setAvailableModels(PHONE_MODELS_BY_BRAND[sale.phoneType as keyof typeof PHONE_MODELS_BY_BRAND]);
    } else {
        setAvailableModels([]);
    }
  }, [sale.phoneType, sale.saleType]);

  useEffect(() => {
    if (sale.saleType === SaleType.Repair) {
        if (sale.assignedTechnician) {
            const selectedTechnician = technicians.find(t => t.id === sale.assignedTechnician);
            if (selectedTechnician) {
                setSale(prev => ({ ...prev, storageLocation: selectedTechnician.name }));
            }
        } else {
            setSale(prev => ({ ...prev, storageLocation: '' }));
        }
    }
  }, [sale.assignedTechnician, sale.saleType, technicians]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'imeiPhoto' | 'devicePhoto') => {
    setFileErrors(prev => ({ ...prev, [field]: undefined }));
    setSale(prev => ({ ...prev, [field]: undefined }));
    if (field === 'imeiPhoto') setImeiPhotoPreview(undefined);
    else setDevicePhotoPreview(undefined);

    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setFileErrors(prev => ({ ...prev, [field]: 'Invalid file type. Please upload an image (JPEG, PNG, GIF, WebP).' }));
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileErrors(prev => ({ ...prev, [field]: `File is too large. Maximum size is ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB.` }));
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setSale(prev => ({ ...prev, [field]: base64String }));
      if (field === 'imeiPhoto') setImeiPhotoPreview(base64String);
      else setDevicePhotoPreview(base64String);
    };
    reader.onerror = () => {
      setFileErrors(prev => ({ ...prev, [field]: 'Failed to read the file. Please try again.' }));
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleSaleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as SaleType;
    setOtherItemName('');
    setOtherRepair('');
    setSale(prev => {
        const newState: Partial<Sale> = { ...prev, saleType: newType, phoneType: '', phoneModel: '' };
        if (newType === SaleType.Accessory || newType === SaleType.B2B_FundiShopSale) {
            delete newState.repairType;
            delete newState.assignedTechnician;
            delete newState.estimatedRepairTime;
            delete newState.storageLocation;
            delete newState.phoneModel;
            delete newState.devicePhoto;
            delete newState.receivedInShop;
            newState.status = Status.Completed;
        } else if (newType === SaleType.Repair) {
            delete newState.imeiPhoto;
            newState.status = Status.Pending;
        } else if (newType === SaleType.PhoneSale) {
            delete newState.repairType;
            delete newState.assignedTechnician;
            delete newState.estimatedRepairTime;
            delete newState.storageLocation;
            delete newState.devicePhoto;
            delete newState.receivedInShop;
            newState.status = Status.Completed;
        }

        if (newType === SaleType.Accessory || newType === SaleType.Repair || newType === SaleType.B2B_FundiShopSale) {
            newState.paymentMethod = PaymentMethod.Cash;
            delete newState.lipaMdogoMdogoPlan;
            delete newState.lipaMdogoMdogoAmount;
            delete newState.onfoneTransactionId;
        }
        
        return newState;
    });
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'phoneType' && value !== 'Other') {
        setOtherItemName('');
    }
    if (name === 'repairType' && value !== 'Other') {
        setOtherRepair('');
    }

    let finalValue: any = value;

    if (name === 'price' || name === 'lipaMdogoMdogoAmount' || name === 'creditAmountPaid') finalValue = parseFloat(value) || 0;
    if (name === 'receivedInShop') finalValue = value === 'true';
    if (type === 'checkbox' && e.target instanceof HTMLInputElement) finalValue = e.target.checked;
    
    setSale(prev => {
        const newState: Partial<Sale> = { ...prev, [name]: finalValue };

        if (name === 'paymentMethod') {
            if (value !== PaymentMethod.Mpesa) delete newState.mpesaNumber;
            if (value !== PaymentMethod.LipaMdogoMdogo) {
                delete newState.lipaMdogoMdogoPlan;
                delete newState.lipaMdogoMdogoAmount;
            }
            if (value !== PaymentMethod.Onfone) delete newState.onfoneTransactionId;
            if (value !== PaymentMethod.Credit) {
                delete newState.customerIdNumber;
                delete newState.creditDueDate;
                delete newState.creditAmountPaid;
            }
        }

        if (name === 'phoneType' && prev.phoneType !== value) {
            newState.phoneModel = '';
        }
        
        return newState;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if ((sale.saleType === SaleType.Accessory || sale.saleType === SaleType.B2B_FundiShopSale) && sale.phoneType === 'Other' && !otherItemName.trim()) {
      alert('Please specify the product name in the "Other" field.');
      return;
    }

    if (sale.saleType === SaleType.Repair && sale.repairType === 'Other' && !otherRepair.trim()) {
      alert('Please specify the repair type in the "Other" field.');
      return;
    }

    if (sale.customerName && (sale.phoneType || otherItemName) && (sale.price || 0) >= 0 && sale.saleType) {
       const saleDataForSave = { ...sale };

      if ((sale.saleType === SaleType.Accessory || sale.saleType === SaleType.B2B_FundiShopSale) && sale.phoneType === 'Other') {
        saleDataForSave.phoneType = otherItemName.trim();
      }
      if (sale.saleType === SaleType.Repair && sale.repairType === 'Other') {
        saleDataForSave.repairType = otherRepair.trim();
      }

      const finalSale: Sale = saleToEdit 
        ? { ...saleToEdit, ...saleDataForSave, receiptDate: new Date().toISOString() }
        : { 
            ...saleDataForSave, 
            id: crypto.randomUUID(), 
            receiptNumber: getNewReceiptNumber(),
            status: sale.status || (sale.saleType === SaleType.Repair ? Status.Pending : Status.Completed),
            price: sale.price || 0,
            dateBooked: sale.dateBooked || new Date().toISOString().split('T')[0],
            receiptDate: new Date().toISOString(),
            paymentMethod: sale.paymentMethod || PaymentMethod.Cash,
            notes: sale.notes || '',
            phoneType: sale.phoneType || '',
            customerName: sale.customerName || '',
          } as Sale;
      onSave(finalSale);
    } else {
      alert('Please fill in all required fields: Customer Name, Item/Phone, Price and Sale Type.');
    }
  };
  
  const inputClasses = "w-full bg-brand-surface dark:bg-[#374151] border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition";
  const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
  
  const getTitle = () => {
      if(saleToEdit) return `Edit ${sale.saleType} Sale`;
      if (sale.saleType === SaleType.PhoneSale) return 'New Phone Sale';
      if (sale.saleType === SaleType.B2B_FundiShopSale) return 'New B2B/Fundi Shop Sale';
      return `New ${sale.saleType} Sale`;
  }
  
  const isPhoneBasedSale = sale.saleType === SaleType.Repair || sale.saleType === SaleType.PhoneSale;

  const paymentOptions = useMemo(() => {
    switch (sale.saleType) {
      case SaleType.B2B_FundiShopSale:
      case SaleType.Repair:
        return [PaymentMethod.Cash, PaymentMethod.Mpesa, PaymentMethod.Credit];
      case SaleType.Accessory:
        return [PaymentMethod.Cash, PaymentMethod.Mpesa];
      case SaleType.PhoneSale:
        return [PaymentMethod.Cash, PaymentMethod.Mpesa, PaymentMethod.LipaMdogoMdogo, PaymentMethod.Onfone, PaymentMethod.Credit];
      default:
        return [PaymentMethod.Cash, PaymentMethod.Mpesa];
    }
  }, [sale.saleType]);

  return (
    <form onSubmit={handleSubmit} className="p-3 space-y-3 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{getTitle()}</h2>
      
      {saleToEdit && (
        <div>
            <label htmlFor="saleType" className={labelClasses}>Sale Type</label>
            <select id="saleType" name="saleType" value={sale.saleType} onChange={handleSaleTypeChange} className={inputClasses}>
                {Object.values(SaleType).map(type => <option key={type} value={type}>{type}</option>)}
            </select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
            <label htmlFor="customerName" className={labelClasses}>Customer Name</label>
            <input type="text" id="customerName" name="customerName" value={sale.customerName} onChange={handleChange} className={inputClasses} required />
        </div>
        <div>
            <label htmlFor="customerNumber" className={labelClasses}>Customer Number</label>
            <input type="tel" id="customerNumber" name="customerNumber" value={sale.customerNumber || ''} onChange={handleChange} className={inputClasses} placeholder="e.g. 0712345678" />
        </div>
      </div>

      {isPhoneBasedSale && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
                <label htmlFor="phoneType" className={labelClasses}>Phone Brand</label>
                <select id="phoneType" name="phoneType" value={sale.phoneType} onChange={handleChange} className={inputClasses} required>
                    <option value="">Select Brand</option>
                    {Object.keys(PHONE_MODELS_BY_BRAND).map(brand => <option key={brand} value={brand}>{brand}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="phoneModel" className={labelClasses}>Phone Model</label>
                <select id="phoneModel" name="phoneModel" value={sale.phoneModel || ''} onChange={handleChange} className={inputClasses} disabled={!sale.phoneType || availableModels.length === 0} required>
                    <option value="">{availableModels.length > 0 ? 'Select Model' : 'Select brand first'}</option>
                    {availableModels.map(model => <option key={model} value={model}>{model}</option>)}
                </select>
            </div>
        </div>
      )}

      {(sale.saleType === SaleType.Accessory || sale.saleType === SaleType.B2B_FundiShopSale) && (
        <div>
            <label htmlFor="phoneType" className={labelClasses}>
                {sale.saleType === SaleType.Accessory ? 'Accessory Product' : 'Repair Spare'}
            </label>
            <select
              id="phoneType"
              name="phoneType"
              value={sale.phoneType}
              onChange={handleChange}
              className={inputClasses}
              required
            >
              <option value="">
                {sale.saleType === SaleType.Accessory ? 'Select an Accessory' : 'Select a Spare Part'}
              </option>
              {(sale.saleType === SaleType.Accessory ? ACCESSORY_PRODUCTS : sparePartsList).map(p => <option key={p} value={p}>{p}</option>)}
              <option value="Other">Other</option>
            </select>
            {sale.phoneType === 'Other' && (
                 <input
                    type="text"
                    id="otherItemName"
                    name="otherItemName"
                    value={otherItemName}
                    onChange={(e) => setOtherItemName(e.target.value)}
                    className={`${inputClasses} mt-2`}
                    placeholder={sale.saleType === SaleType.Accessory ? 'Enter custom product name' : 'Enter custom spare part name'}
                    required
                />
            )}
        </div>
      )}

       {sale.saleType === SaleType.Repair && (
            <div>
              <label htmlFor="repairType" className={labelClasses}>Repair Type</label>
              <select
                id="repairType"
                name="repairType"
                value={sale.repairType || ''}
                onChange={handleChange}
                className={inputClasses}
                required
              >
                <option value="">Select a Repair Type</option>
                {REPAIR_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                <option value="Other">Other</option>
              </select>
               {sale.repairType === 'Other' && (
                    <input
                        type="text"
                        id="otherRepair"
                        name="otherRepair"
                        value={otherRepair}
                        onChange={(e) => setOtherRepair(e.target.value)}
                        className={`${inputClasses} mt-2`}
                        placeholder="Enter custom repair type"
                        required
                    />
                )}
            </div>
        )}
      
      {sale.saleType === SaleType.PhoneSale && (
        <div>
          <label className={labelClasses}>IMEI Photo (use camera)</label>
          <input type="file" accept="image/*" capture="environment" onChange={(e) => handleFileChange(e, 'imeiPhoto')} className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-primary file:text-white hover:file:bg-blue-700"/>
          {fileErrors.imeiPhoto && <p className="text-sm text-red-500 mt-1">{fileErrors.imeiPhoto}</p>}
          {imeiPhotoPreview && !fileErrors.imeiPhoto && <img src={imeiPhotoPreview} alt="IMEI Preview" className="mt-2 rounded-md max-h-40" />}
        </div>
      )}

      {sale.saleType === SaleType.Repair && (
        <div>
          <label className={labelClasses}>Device Photo (use camera)</label>
          <input type="file" accept="image/*" capture="environment" onChange={(e) => handleFileChange(e, 'devicePhoto')} className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-primary file:text-white hover:file:bg-blue-700"/>
          {fileErrors.devicePhoto && <p className="text-sm text-red-500 mt-1">{fileErrors.devicePhoto}</p>}
          {devicePhotoPreview && !fileErrors.devicePhoto && <img src={devicePhotoPreview} alt="Device Preview" className="mt-2 rounded-md max-h-40" />}
        </div>
      )}


      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label htmlFor="price" className={labelClasses}>Price (Kshs)</label>
          <input type="number" id="price" name="price" value={sale.price} onChange={handleChange} onFocus={(e) => e.target.select()} className={inputClasses} required />
        </div>
        {sale.saleType === SaleType.Repair && (
            <div>
                <label htmlFor="assignedTechnician" className={labelClasses}>Assigned Technician</label>
                <select id="assignedTechnician" name="assignedTechnician" value={sale.assignedTechnician || ''} onChange={handleChange} className={inputClasses}>
                    <option value="">Select Technician</option>
                    {technicians.map(tech => <option key={tech.id} value={tech.id}>{tech.name}</option>)}
                </select>
            </div>
        )}
      </div>

       <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label htmlFor="paymentMethod" className={labelClasses}>Payment Method</label>
                    <select id="paymentMethod" name="paymentMethod" value={sale.paymentMethod} onChange={handleChange} className={inputClasses}>
                        {paymentOptions.map(method => <option key={method} value={method}>{method}</option>)}
                    </select>
                </div>
                {sale.paymentMethod === PaymentMethod.Mpesa && (
                <div>
                    <label htmlFor="mpesaNumber" className={labelClasses}>M-Pesa Number</label>
                    <input type="tel" id="mpesaNumber" name="mpesaNumber" value={sale.mpesaNumber || ''} onChange={handleChange} className={inputClasses} placeholder="e.g. 254712345678" />
                </div>
                )}
            </div>

            {sale.paymentMethod === PaymentMethod.LipaMdogoMdogo && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div>
                        <label htmlFor="lipaMdogoMdogoPlan" className={labelClasses}>Installment Plan</label>
                        <select id="lipaMdogoMdogoPlan" name="lipaMdogoMdogoPlan" value={sale.lipaMdogoMdogoPlan || ''} onChange={handleChange} className={inputClasses}>
                            <option value="">Select Plan</option>
                            <option value="Daily">Daily</option>
                            <option value="Weekly">Weekly</option>
                            <option value="Monthly">Monthly</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="lipaMdogoMdogoAmount" className={labelClasses}>Installment Amount (Kshs)</label>
                        <input type="number" id="lipaMdogoMdogoAmount" name="lipaMdogoMdogoAmount" value={sale.lipaMdogoMdogoAmount || ''} onChange={handleChange} onFocus={(e) => e.target.select()} className={inputClasses} />
                    </div>
                </div>
            )}

            {sale.paymentMethod === PaymentMethod.Onfone && (
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <label htmlFor="onfoneTransactionId" className={labelClasses}>Onfone Transaction ID</label>
                    <input type="text" id="onfoneTransactionId" name="onfoneTransactionId" value={sale.onfoneTransactionId || ''} onChange={handleChange} className={inputClasses} placeholder="Enter Transaction ID" />
                </div>
            )}

            {sale.paymentMethod === PaymentMethod.Credit && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div>
                      <label htmlFor="customerIdNumber" className={labelClasses}>Customer ID Number</label>
                      <input type="text" id="customerIdNumber" name="customerIdNumber" value={sale.customerIdNumber || ''} onChange={handleChange} className={inputClasses} required />
                  </div>
                  <div>
                      <label htmlFor="creditDueDate" className={labelClasses}>Due Date</label>
                      <input type="date" id="creditDueDate" name="creditDueDate" value={sale.creditDueDate || ''} onChange={handleChange} className={inputClasses} />
                  </div>
                  <div>
                      <label htmlFor="creditAmountPaid" className={labelClasses}>Amount Paid (Initial)</label>
                      <input type="number" id="creditAmountPaid" name="creditAmountPaid" value={sale.creditAmountPaid || 0} onChange={handleChange} onFocus={(e) => e.target.select()} className={inputClasses} />
                  </div>
                  <div>
                      <label className={labelClasses}>Remaining Balance</label>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-900 dark:text-white font-semibold">
                          Kshs {((sale.price || 0) - (sale.creditAmountPaid || 0)).toLocaleString()}
                      </div>
                  </div>
              </div>
            )}
        </div>

      {sale.saleType === SaleType.Repair && (
        <div>
            <label htmlFor="storageLocation" className={labelClasses}>Storage Location</label>
            <input type="text" id="storageLocation" name="storageLocation" value={sale.storageLocation || ''} className={inputClasses + " bg-gray-100 dark:bg-gray-800 cursor-not-allowed"} readOnly />
        </div>
      )}

      {sale.saleType === SaleType.Repair && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
                <label htmlFor="estimatedRepairTime" className={labelClasses}>Estimated Repair Time</label>
                <select id="estimatedRepairTime" name="estimatedRepairTime" value={sale.estimatedRepairTime || ''} onChange={handleChange} className={inputClasses}>
                    <option value="">Select Time</option>
                    {REPAIR_TIME_OPTIONS.map(time => <option key={time} value={time}>{time}</option>)}
                </select>
            </div>
             <div>
                <label htmlFor="receivedInShop" className={labelClasses}>Received at Repair Shop?</label>
                <select id="receivedInShop" name="receivedInShop" value={String(sale.receivedInShop)} onChange={handleChange} className={inputClasses}>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                </select>
            </div>
        </div>
      )}
      
      <div>
        <label htmlFor="notes" className={labelClasses}>Notes</label>
        <textarea id="notes" name="notes" value={sale.notes} onChange={handleChange} rows={3} className={inputClasses}></textarea>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sale.saleType === SaleType.Repair && (
            <div>
                <label htmlFor="status" className={labelClasses}>Status</label>
                <select id="status" name="status" value={sale.status} onChange={handleChange} className={inputClasses}>
                    {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
        )}
         {sale.saleType === SaleType.PhoneSale && (
             <div>
                <label htmlFor="dateCollection" className={labelClasses}>Collection Date</label>
                <input type="date" id="dateCollection" name="dateCollection" value={sale.dateCollection || ''} onChange={handleChange} className={inputClasses} />
            </div>
         )}
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-brand-surface dark:bg-[#374151] border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-blue-700 transition font-semibold">{saleToEdit ? 'Save Changes' : 'Create Sale'}</button>
      </div>
    </form>
  );
};