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

type FormErrors = {
  [key in keyof Partial<Sale> | 'otherItemName' | 'otherRepair']: string;
};

export const OrderForm: React.FC<SaleFormProps> = ({ saleToEdit, onSave, onCancel, getNewReceiptNumber, technicians, saleType, purchases }) => {
  const [sale, setSale] = useState<Partial<Sale>>({
    customerName: '',
    customerNumber: '',
    phoneType: '',
    phoneModel: '',
    saleType: saleType,
    repairType: '',
    price: 0,
    unitPrice: 0,
    quantity: 1,
    discount: 0,
    assignedTechnician: technicians[0]?.id || '',
    estimatedRepairTime: '',
    storageLocation: '',
    notes: '',
    dateBooked: new Date().toISOString().split('T')[0],
    status: (saleType === SaleType.Repair || saleType === SaleType.Return) ? Status.Pending : Status.Completed,
    paymentMethod: PaymentMethod.Cash,
    receivedInShop: true,
  });
  const [imeiPhotoPreview, setImeiPhotoPreview] = useState<string | undefined>(undefined);
  const [devicePhotoPreview, setDevicePhotoPreview] = useState<string | undefined>(undefined);
  const [fileErrors, setFileErrors] = useState<{ imeiPhoto?: string; devicePhoto?: string }>({});
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [otherItemName, setOtherItemName] = useState('');
  const [otherRepair, setOtherRepair] = useState('');
  const [errors, setErrors] = useState<Partial<FormErrors>>({});
  const [isFormValid, setIsFormValid] = useState(false);

  const sparePartsList = useMemo(() => {
    const parts = new Set<string>();
    purchases.forEach(p => parts.add(p.product));
    return Array.from(parts).sort();
  }, [purchases]);
  
  const finalPrice = useMemo(() => {
    const subTotal = (sale.saleType === SaleType.Accessory || sale.saleType === SaleType.B2B_FundiShopSale || sale.saleType === SaleType.Return)
      ? (sale.unitPrice || 0) * (sale.quantity || 1)
      : (sale.price || 0);
    return subTotal - (sale.discount || 0);
  }, [sale.saleType, sale.price, sale.unitPrice, sale.quantity, sale.discount]);

  const validateForm = (currentSale: Partial<Sale>, otherItem: string, otherRepairItem: string) => {
    const newErrors: Partial<FormErrors> = {};
    if (!currentSale.customerName?.trim()) newErrors.customerName = 'Customer name is required.';
    
    const isPhoneBased = currentSale.saleType === SaleType.Repair || currentSale.saleType === SaleType.PhoneSale;
    const isItemBased = currentSale.saleType === SaleType.Accessory || currentSale.saleType === SaleType.B2B_FundiShopSale || currentSale.saleType === SaleType.Return;

    if (isPhoneBased) {
        if (!currentSale.phoneType) newErrors.phoneType = 'Phone brand is required.';
        if (!currentSale.phoneModel) newErrors.phoneModel = 'Phone model is required.';
    }

    if (isItemBased) {
        if (!currentSale.phoneType) newErrors.phoneType = 'Product is required.';
        if (currentSale.phoneType === 'Other' && !otherItem.trim()) newErrors.otherItemName = 'Please specify the product name.';
    }

    if (currentSale.saleType === SaleType.Repair) {
        if (!currentSale.repairType) newErrors.repairType = 'Repair type is required.';
        if (currentSale.repairType === 'Other' && !otherRepairItem.trim()) newErrors.otherRepair = 'Please specify the repair type.';
    }

    if (isItemBased) {
        if ((currentSale.unitPrice ?? 0) <= 0) newErrors.unitPrice = 'Unit price must be greater than zero.';
        if ((currentSale.quantity ?? 0) < 1) newErrors.quantity = 'Quantity must be at least 1.';
    } else {
        if ((currentSale.price ?? 0) <= 0) newErrors.price = 'Price must be greater than zero.';
    }

    if(currentSale.paymentMethod === PaymentMethod.Credit && !currentSale.customerIdNumber) {
        newErrors.customerIdNumber = 'Customer ID number is required for credit sales.';
    }

    return newErrors;
  }

  useEffect(() => {
      const validationErrors = validateForm(sale, otherItemName, otherRepair);
      setErrors(validationErrors);
      setIsFormValid(Object.keys(validationErrors).length === 0);
  }, [sale, otherItemName, otherRepair]);

  useEffect(() => {
    if (saleToEdit) {
      const saleData: Partial<Sale> = { 
          ...saleToEdit,
          unitPrice: saleToEdit.unitPrice ?? (saleToEdit.saleType === SaleType.Accessory ? saleToEdit.price : 0),
          quantity: saleToEdit.quantity ?? 1,
          discount: saleToEdit.discount ?? 0,
      };
      
      const isAccessory = saleToEdit.saleType === SaleType.Accessory || saleToEdit.saleType === SaleType.Return;
      const isB2B = saleToEdit.saleType === SaleType.B2B_FundiShopSale;

      if (isAccessory && !ACCESSORY_PRODUCTS.includes(saleToEdit.phoneType)) {
        saleData.phoneType = 'Other'; setOtherItemName(saleToEdit.phoneType);
      } else if (isB2B && !sparePartsList.includes(saleToEdit.phoneType)) {
        saleData.phoneType = 'Other'; setOtherItemName(saleToEdit.phoneType);
      } else { setOtherItemName(''); }

      if (saleToEdit.saleType === SaleType.Repair && saleToEdit.repairType && !REPAIR_TYPES.includes(saleToEdit.repairType)) {
        saleData.repairType = 'Other'; setOtherRepair(saleToEdit.repairType);
      } else { setOtherRepair(''); }
      
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
            if (selectedTechnician) setSale(prev => ({ ...prev, storageLocation: selectedTechnician.name }));
        } else { setSale(prev => ({ ...prev, storageLocation: '' })); }
    }
  }, [sale.assignedTechnician, sale.saleType, technicians]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'imeiPhoto' | 'devicePhoto') => {
    setFileErrors(prev => ({ ...prev, [field]: undefined }));
    setSale(prev => ({ ...prev, [field]: undefined }));
    if (field === 'imeiPhoto') setImeiPhotoPreview(undefined); else setDevicePhotoPreview(undefined);

    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setFileErrors(prev => ({ ...prev, [field]: 'Invalid file type. Please upload an image (JPEG, PNG, GIF, WebP).' })); e.target.value = ''; return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileErrors(prev => ({ ...prev, [field]: `File is too large. Maximum size is ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB.` })); e.target.value = ''; return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setSale(prev => ({ ...prev, [field]: base64String }));
      if (field === 'imeiPhoto') setImeiPhotoPreview(base64String); else setDevicePhotoPreview(base64String);
    };
    reader.onerror = () => {
      setFileErrors(prev => ({ ...prev, [field]: 'Failed to read the file. Please try again.' })); e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleSaleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as SaleType;
    setOtherItemName(''); setOtherRepair('');
    setSale(prev => {
        const newState: Partial<Sale> = { ...prev, saleType: newType, phoneType: '', phoneModel: '' };
        if ([SaleType.Accessory, SaleType.B2B_FundiShopSale, SaleType.Return].includes(newType)) {
            Object.assign(newState, { repairType: undefined, assignedTechnician: undefined, estimatedRepairTime: undefined, storageLocation: undefined, phoneModel: undefined, devicePhoto: undefined, receivedInShop: undefined, status: Status.Completed });
        } else if (newType === SaleType.Repair) {
            Object.assign(newState, { imeiPhoto: undefined, status: Status.Pending });
        } else if (newType === SaleType.PhoneSale) {
            Object.assign(newState, { repairType: undefined, assignedTechnician: undefined, estimatedRepairTime: undefined, storageLocation: undefined, devicePhoto: undefined, receivedInShop: undefined, status: Status.Completed });
        }

        if ([SaleType.Accessory, SaleType.Repair, SaleType.B2B_FundiShopSale, SaleType.Return].includes(newType)) {
            newState.paymentMethod = PaymentMethod.Cash;
            Object.assign(newState, { lipaMdogoMdogoPlan: undefined, lipaMdogoMdogoAmount: undefined, onfoneTransactionId: undefined });
        }
        return newState;
    });
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'phoneType' && value !== 'Other') setOtherItemName('');
    if (name === 'repairType' && value !== 'Other') setOtherRepair('');

    let finalValue: any = value;
    if (['price', 'unitPrice', 'quantity', 'discount', 'lipaMdogoMdogoAmount', 'creditAmountPaid'].includes(name)) finalValue = parseFloat(value) || 0;
    if (name === 'receivedInShop') finalValue = value === 'true';
    if (type === 'checkbox' && e.target instanceof HTMLInputElement) finalValue = e.target.checked;
    
    setSale(prev => {
        const newState: Partial<Sale> = { ...prev, [name]: finalValue };
        if (name === 'paymentMethod') {
            if (value !== PaymentMethod.Mpesa) newState.mpesaNumber = undefined;
            if (value !== PaymentMethod.LipaMdogoMdogo) Object.assign(newState, { lipaMdogoMdogoPlan: undefined, lipaMdogoMdogoAmount: undefined });
            if (value !== PaymentMethod.Onfone) newState.onfoneTransactionId = undefined;
            if (value !== PaymentMethod.Credit) Object.assign(newState, { customerIdNumber: undefined, creditDueDate: undefined, creditAmountPaid: undefined });
        }
        if (name === 'phoneType' && prev.phoneType !== value) newState.phoneModel = '';
        return newState;
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
        alert('Please fix the errors before submitting.');
        return;
    }
    
    const saleDataForSave: Partial<Sale> = { ...sale };

    if ((sale.saleType === SaleType.Accessory || sale.saleType === SaleType.B2B_FundiShopSale || sale.saleType === SaleType.Return) && sale.phoneType === 'Other') {
        saleDataForSave.phoneType = otherItemName.trim();
    }
    if (sale.saleType === SaleType.Repair && sale.repairType === 'Other') {
        saleDataForSave.repairType = otherRepair.trim();
    }
    
    saleDataForSave.price = finalPrice;
    
    if (sale.saleType === SaleType.Accessory || sale.saleType === SaleType.B2B_FundiShopSale || sale.saleType === SaleType.Return) {
        saleDataForSave.unitPrice = sale.unitPrice; saleDataForSave.quantity = sale.quantity;
    } else {
        saleDataForSave.unitPrice = sale.price; saleDataForSave.quantity = 1;
    }

    const finalSale: Sale = saleToEdit 
        ? { ...saleToEdit, ...saleDataForSave, receiptDate: new Date().toISOString() }
        : { 
            ...saleDataForSave, 
            id: crypto.randomUUID(), 
            receiptNumber: getNewReceiptNumber(),
            status: sale.status || (sale.saleType === SaleType.Repair ? Status.Pending : Status.Completed),
            dateBooked: sale.dateBooked || new Date().toISOString().split('T')[0],
            receiptDate: new Date().toISOString(),
            paymentMethod: sale.paymentMethod || PaymentMethod.Cash,
            notes: sale.notes || '',
            phoneType: saleDataForSave.phoneType || '',
            customerName: sale.customerName || '',
        } as Sale;
    onSave(finalSale);
  };
  
  const getInputClasses = (fieldName: keyof FormErrors) => `w-full bg-brand-surface dark:bg-[#374151] border ${errors[fieldName] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md p-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition`;
  const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
  
  const getTitle = () => {
      if(saleToEdit) return `Edit ${sale.saleType} Sale`;
      return `New ${sale.saleType} Sale`;
  }
  
  const isPhoneBasedSale = sale.saleType === SaleType.Repair || sale.saleType === SaleType.PhoneSale;
  const isQuantityBasedSale = sale.saleType === SaleType.Accessory || sale.saleType === SaleType.B2B_FundiShopSale || sale.saleType === SaleType.Return;

  const paymentOptions = useMemo(() => {
    switch (sale.saleType) {
      case SaleType.B2B_FundiShopSale:
      case SaleType.Repair:
        return [PaymentMethod.Cash, PaymentMethod.Mpesa, PaymentMethod.Credit];
      case SaleType.Accessory:
      case SaleType.Return:
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
            <select id="saleType" name="saleType" value={sale.saleType} onChange={handleSaleTypeChange} className={getInputClasses('saleType')}>{Object.values(SaleType).map(type => <option key={type} value={type}>{type}</option>)}</select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
            <label htmlFor="customerName" className={labelClasses}>Customer Name</label>
            <input type="text" id="customerName" name="customerName" value={sale.customerName} onChange={handleChange} className={getInputClasses('customerName')} />
            {errors.customerName && <p className="text-sm text-red-500 mt-1">{errors.customerName}</p>}
        </div>
        <div>
            <label htmlFor="customerNumber" className={labelClasses}>Customer Number</label>
            <input type="tel" id="customerNumber" name="customerNumber" value={sale.customerNumber || ''} onChange={handleChange} className={getInputClasses('customerNumber')} placeholder="e.g. 0712345678" />
        </div>
      </div>

      {isPhoneBasedSale && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
                <label htmlFor="phoneType" className={labelClasses}>Phone Brand</label>
                <select id="phoneType" name="phoneType" value={sale.phoneType} onChange={handleChange} className={getInputClasses('phoneType')}>
                    <option value="">Select Brand</option>
                    {Object.keys(PHONE_MODELS_BY_BRAND).map(brand => <option key={brand} value={brand}>{brand}</option>)}
                </select>
                 {errors.phoneType && <p className="text-sm text-red-500 mt-1">{errors.phoneType}</p>}
            </div>
            <div>
                <label htmlFor="phoneModel" className={labelClasses}>Phone Model</label>
                <select id="phoneModel" name="phoneModel" value={sale.phoneModel || ''} onChange={handleChange} className={getInputClasses('phoneModel')} disabled={!sale.phoneType || availableModels.length === 0}>
                    <option value="">{availableModels.length > 0 ? 'Select Model' : 'Select brand first'}</option>
                    {availableModels.map(model => <option key={model} value={model}>{model}</option>)}
                </select>
                {errors.phoneModel && <p className="text-sm text-red-500 mt-1">{errors.phoneModel}</p>}
            </div>
        </div>
      )}

      {isQuantityBasedSale && (
        <div>
            <label htmlFor="phoneType" className={labelClasses}>{sale.saleType === SaleType.Accessory ? 'Accessory Product' : (sale.saleType === SaleType.Return ? 'Item Returned' : 'Repair Spare')}</label>
            <select id="phoneType" name="phoneType" value={sale.phoneType} onChange={handleChange} className={getInputClasses('phoneType')}>
              <option value="">{sale.saleType === SaleType.Accessory ? 'Select an Accessory' : (sale.saleType === SaleType.Return ? 'Select Item' : 'Select a Spare Part')}</option>
              {(sale.saleType === SaleType.B2B_FundiShopSale ? sparePartsList : ACCESSORY_PRODUCTS).map(p => <option key={p} value={p}>{p}</option>)}
              <option value="Other">Other</option>
            </select>
            {errors.phoneType && <p className="text-sm text-red-500 mt-1">{errors.phoneType}</p>}
            {sale.phoneType === 'Other' && (
                 <input type="text" id="otherItemName" name="otherItemName" value={otherItemName} onChange={(e) => setOtherItemName(e.target.value)} className={`${getInputClasses('otherItemName')} mt-2`} placeholder="Enter custom product name" />
            )}
             {errors.otherItemName && <p className="text-sm text-red-500 mt-1">{errors.otherItemName}</p>}
        </div>
      )}

       {sale.saleType === SaleType.Repair && (
            <div>
              <label htmlFor="repairType" className={labelClasses}>Repair Type</label>
              <select id="repairType" name="repairType" value={sale.repairType || ''} onChange={handleChange} className={getInputClasses('repairType')}>
                <option value="">Select a Repair Type</option>
                {REPAIR_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                <option value="Other">Other</option>
              </select>
              {errors.repairType && <p className="text-sm text-red-500 mt-1">{errors.repairType}</p>}
               {sale.repairType === 'Other' && (
                    <input type="text" id="otherRepair" name="otherRepair" value={otherRepair} onChange={(e) => setOtherRepair(e.target.value)} className={`${getInputClasses('otherRepair')} mt-2`} placeholder="Enter custom repair type" />
                )}
                {errors.otherRepair && <p className="text-sm text-red-500 mt-1">{errors.otherRepair}</p>}
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
        {isQuantityBasedSale ? (
           <>
             <div>
                <label htmlFor="unitPrice" className={labelClasses}>Unit Price (Kshs)</label>
                <input type="number" id="unitPrice" name="unitPrice" value={sale.unitPrice} onChange={handleChange} onFocus={(e) => e.target.select()} className={getInputClasses('unitPrice')} />
                {errors.unitPrice && <p className="text-sm text-red-500 mt-1">{errors.unitPrice}</p>}
             </div>
             <div>
                <label htmlFor="quantity" className={labelClasses}>Quantity</label>
                <input type="number" id="quantity" name="quantity" value={sale.quantity} onChange={handleChange} onFocus={(e) => e.target.select()} className={getInputClasses('quantity')} min="1" />
                {errors.quantity && <p className="text-sm text-red-500 mt-1">{errors.quantity}</p>}
             </div>
           </>
        ) : (
             <div>
                <label htmlFor="price" className={labelClasses}>Price (Kshs)</label>
                <input type="number" id="price" name="price" value={sale.price} onChange={handleChange} onFocus={(e) => e.target.select()} className={getInputClasses('price')} />
                {errors.price && <p className="text-sm text-red-500 mt-1">{errors.price}</p>}
             </div>
        )}
        
        {sale.saleType === SaleType.Repair && (
            <div>
                <label htmlFor="assignedTechnician" className={labelClasses}>Assigned Technician</label>
                <select id="assignedTechnician" name="assignedTechnician" value={sale.assignedTechnician || ''} onChange={handleChange} className={getInputClasses('assignedTechnician')}>
                    <option value="">Select Technician</option>
                    {technicians.map(tech => <option key={tech.id} value={tech.id}>{tech.name}</option>)}
                </select>
            </div>
        )}
      </div>

       <div className="p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label htmlFor="discount" className={labelClasses}>Discount (Kshs)</label>
                    <input type="number" id="discount" name="discount" value={sale.discount || ''} onChange={handleChange} onFocus={(e) => e.target.select()} className={getInputClasses('discount')} />
                </div>
                <div>
                    <label className={labelClasses}>Total Price</label>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-900 dark:text-white font-semibold">Kshs {finalPrice.toLocaleString()}</div>
                </div>
            </div>
       </div>

       <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label htmlFor="paymentMethod" className={labelClasses}>Payment Method</label>
                    <select id="paymentMethod" name="paymentMethod" value={sale.paymentMethod} onChange={handleChange} className={getInputClasses('paymentMethod')}>
                        {paymentOptions.map(method => <option key={method} value={method}>{method}</option>)}
                    </select>
                </div>
                {sale.paymentMethod === PaymentMethod.Mpesa && (
                <div>
                    <label htmlFor="mpesaNumber" className={labelClasses}>M-Pesa Number</label>
                    <input type="tel" id="mpesaNumber" name="mpesaNumber" value={sale.mpesaNumber || ''} onChange={handleChange} className={getInputClasses('mpesaNumber')} placeholder="e.g. 254712345678" />
                </div>
                )}
            </div>

            {sale.paymentMethod === PaymentMethod.LipaMdogoMdogo && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div>
                        <label htmlFor="lipaMdogoMdogoPlan" className={labelClasses}>Installment Plan</label>
                        <select id="lipaMdogoMdogoPlan" name="lipaMdogoMdogoPlan" value={sale.lipaMdogoMdogoPlan || ''} onChange={handleChange} className={getInputClasses('lipaMdogoMdogoPlan')}>
                            <option value="">Select Plan</option> <option value="Daily">Daily</option> <option value="Weekly">Weekly</option> <option value="Monthly">Monthly</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="lipaMdogoMdogoAmount" className={labelClasses}>Installment Amount (Kshs)</label>
                        <input type="number" id="lipaMdogoMdogoAmount" name="lipaMdogoMdogoAmount" value={sale.lipaMdogoMdogoAmount || ''} onChange={handleChange} onFocus={(e) => e.target.select()} className={getInputClasses('lipaMdogoMdogoAmount')} />
                    </div>
                </div>
            )}

            {sale.paymentMethod === PaymentMethod.Onfone && (
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <label htmlFor="onfoneTransactionId" className={labelClasses}>Onfone Transaction ID</label>
                    <input type="text" id="onfoneTransactionId" name="onfoneTransactionId" value={sale.onfoneTransactionId || ''} onChange={handleChange} className={getInputClasses('onfoneTransactionId')} placeholder="Enter Transaction ID" />
                </div>
            )}

            {sale.paymentMethod === PaymentMethod.Credit && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div>
                      <label htmlFor="customerIdNumber" className={labelClasses}>Customer ID Number</label>
                      <input type="text" id="customerIdNumber" name="customerIdNumber" value={sale.customerIdNumber || ''} onChange={handleChange} className={getInputClasses('customerIdNumber')} />
                      {errors.customerIdNumber && <p className="text-sm text-red-500 mt-1">{errors.customerIdNumber}</p>}
                  </div>
                  <div>
                      <label htmlFor="creditDueDate" className={labelClasses}>Due Date</label>
                      <input type="date" id="creditDueDate" name="creditDueDate" value={sale.creditDueDate || ''} onChange={handleChange} className={getInputClasses('creditDueDate')} />
                  </div>
                  <div>
                      <label htmlFor="creditAmountPaid" className={labelClasses}>Amount Paid (Initial)</label>
                      <input type="number" id="creditAmountPaid" name="creditAmountPaid" value={sale.creditAmountPaid || 0} onChange={handleChange} onFocus={(e) => e.target.select()} className={getInputClasses('creditAmountPaid')} />
                  </div>
                  <div>
                      <label className={labelClasses}>Remaining Balance</label>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-900 dark:text-white font-semibold">Kshs {(finalPrice - (sale.creditAmountPaid || 0)).toLocaleString()}</div>
                  </div>
              </div>
            )}
        </div>

      {sale.saleType === SaleType.Repair && (
        <div>
            <label htmlFor="storageLocation" className={labelClasses}>Storage Location</label>
            <input type="text" id="storageLocation" name="storageLocation" value={sale.storageLocation || ''} className={getInputClasses('storageLocation') + " bg-gray-100 dark:bg-gray-800 cursor-not-allowed"} readOnly />
        </div>
      )}

      {sale.saleType === SaleType.Repair && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
                <label htmlFor="estimatedRepairTime" className={labelClasses}>Estimated Repair Time</label>
                <select id="estimatedRepairTime" name="estimatedRepairTime" value={sale.estimatedRepairTime || ''} onChange={handleChange} className={getInputClasses('estimatedRepairTime')}>
                    <option value="">Select Time</option>{REPAIR_TIME_OPTIONS.map(time => <option key={time} value={time}>{time}</option>)}
                </select>
            </div>
             <div>
                <label htmlFor="receivedInShop" className={labelClasses}>Received at Repair Shop?</label>
                <select id="receivedInShop" name="receivedInShop" value={String(sale.receivedInShop)} onChange={handleChange} className={getInputClasses('receivedInShop')}>
                    <option value="true">Yes</option><option value="false">No</option>
                </select>
            </div>
        </div>
      )}
      
      <div>
        <label htmlFor="notes" className={labelClasses}>Notes</label>
        <textarea id="notes" name="notes" value={sale.notes} onChange={handleChange} rows={3} className={getInputClasses('notes')}></textarea>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sale.saleType === SaleType.Repair && (
            <div>
                <label htmlFor="status" className={labelClasses}>Status</label>
                <select id="status" name="status" value={sale.status} onChange={handleChange} className={getInputClasses('status')}>{Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}</select>
            </div>
        )}
         {sale.saleType === SaleType.PhoneSale && (
             <div>
                <label htmlFor="dateCollection" className={labelClasses}>Collection Date</label>
                <input type="date" id="dateCollection" name="dateCollection" value={sale.dateCollection || ''} onChange={handleChange} className={getInputClasses('dateCollection')} />
            </div>
         )}
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-brand-surface dark:bg-[#374151] border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition">Cancel</button>
        <button type="submit" disabled={!isFormValid} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-blue-700 transition font-semibold disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed">{saleToEdit ? 'Save Changes' : 'Create Sale'}</button>
      </div>
    </form>
  );
};
