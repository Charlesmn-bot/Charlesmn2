import React, { useState } from 'react';
import { Technician, CustomerServiceRepresentative, User } from '../types';
import { CogIcon } from './icons/CogIcon';
import { ShareIcon } from './icons/ShareIcon';
import { UsersIcon } from './icons/UsersIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { EyeIcon } from './icons/EyeIcon';
import { EyeOffIcon } from './icons/EyeOffIcon';

interface SettingsProps {
    onLogout: () => void;
    technicians: Technician[];
    onAddTechnician: (name: string) => void;
    onUpdateTechnician: (technician: Technician) => void;
    onDeleteTechnician: (id: string) => void;
    csrs: CustomerServiceRepresentative[];
    onAddCsr: (name: string) => void;
    onUpdateCsr: (csr: CustomerServiceRepresentative) => void;
    onDeleteCsr: (id: string) => void;
    theme: string;
    toggleTheme: () => void;
    currentUser: Omit<User, 'password'> | null;
    users: User[];
    onAddUser: (user: Omit<User, 'id'>) => Promise<void>;
    onUpdateUser: (user: User) => Promise<void>;
    onDeleteUser: (id: string) => void;
    onExportData: (dataType: 'sales' | 'purchases' | 'suppliers' | 'technicians' | 'csrs') => void;
    onImportData: (file: File) => Promise<void>;
}

export const Settings: React.FC<SettingsProps> = ({ 
    onLogout, 
    technicians, onAddTechnician, onUpdateTechnician, onDeleteTechnician, 
    csrs, onAddCsr, onUpdateCsr, onDeleteCsr, 
    theme, toggleTheme, currentUser,
    users, onAddUser, onUpdateUser, onDeleteUser,
    onExportData, onImportData
}) => {
  const [isTechModalOpen, setIsTechModalOpen] = useState(false);
  const [isCsrModalOpen, setIsCsrModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const isAdmin = currentUser?.role === 'Admin';

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files.length > 0) {
          setSelectedFile(event.target.files[0]); setImportStatus(null);
      }
  };

  const handleImportClick = async () => {
      if (!selectedFile) return;
      setIsImporting(true); setImportStatus(null);
      try {
          await onImportData(selectedFile);
          setImportStatus({ message: 'Data imported and synced successfully!', type: 'success' });
          setSelectedFile(null); 
          const fileInput = document.getElementById('file-upload') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
      } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
          setImportStatus({ message: `Import failed: ${errorMessage}`, type: 'error' });
      } finally { setIsImporting(false); }
  };
  
  // A generic modal for managing staff (Technicians, CSRs)
  const StaffManagerModal = ({ staff, onSaveNew, onSaveUpdate, onDelete, staffType, onClose }: any) => {
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<any | null>(null);
    const [staffName, setStaffName] = useState('');

    const openFormModal = (staffMember: any | null = null) => {
      setEditingStaff(staffMember); setStaffName(staffMember ? staffMember.name : ''); setFormModalOpen(true);
    };
    const closeFormModal = () => { setFormModalOpen(false); setEditingStaff(null); setStaffName(''); };
    const handleSave = () => {
      if (staffName.trim() === '') return;
      if (editingStaff) onSaveUpdate({ ...editingStaff, name: staffName }); else onSaveNew(staffName);
      closeFormModal();
    };
    const handleDelete = (id: string) => { if(window.confirm(`Are you sure you want to delete this ${staffType}? This cannot be undone.`)) onDelete(id); }

    const sortedStaff = [...staff].sort((a: any, b: any) => a.name.localeCompare(b.name));
    const inputClasses = "w-full bg-brand-surface dark:bg-[#374151] border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-primary";

    return (
       <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-brand-header dark:bg-[#111827] rounded-lg shadow-xl p-5 w-full max-w-md max-h-[80vh] flex flex-col">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Manage {staffType}s</h2>
                <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2">
                  {sortedStaff.map((s: any) => (
                    <div key={s.id} className="bg-brand-surface dark:bg-[#374151] p-3 rounded-md flex justify-between items-center">
                      <p className="font-semibold text-gray-900 dark:text-white">{s.name}</p>
                      <div className="space-x-2">
                          <button onClick={() => openFormModal(s)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm">Edit</button>
                          <button onClick={() => handleDelete(s.id)} className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 text-sm">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
                 <button onClick={() => openFormModal()} className="w-full bg-brand-secondary text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-700 transition">Add New {staffType}</button>
                 <button onClick={onClose} className="w-full mt-4 p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-800 rounded-md transition">Close</button>
            </div>
            
            {isFormModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[60] p-4">
                <div className="bg-brand-surface dark:bg-[#374151] rounded-lg shadow-xl p-5 w-full max-w-sm">
                  <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{editingStaff ? `Edit ${staffType}` : `Add ${staffType}`}</h2>
                  <input type="text" value={staffName} onChange={(e) => setStaffName(e.target.value)} className={inputClasses} placeholder={`${staffType}'s Name`} />
                  <div className="flex justify-end space-x-4 mt-6">
                    <button onClick={closeFormModal} className="px-4 py-2 bg-brand-header dark:bg-[#111827] border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-100">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-blue-700 font-semibold">Save</button>
                  </div>
                </div>
              </div>
            )}
        </div>
    )
  }

  const UserManagerModal = () => {
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userData, setUserData] = useState({ username: '', password: '', role: 'Cashier' as 'Admin' | 'Cashier' });
    const [formError, setFormError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const openFormModal = (user: User | null = null) => {
      setEditingUser(user);
      setUserData(user ? { username: user.username, password: '', role: user.role } : { username: '', password: '', role: 'Cashier' });
      setFormError(''); setFormModalOpen(true);
    };

    const closeFormModal = () => { setFormModalOpen(false); setEditingUser(null); };

    const handleSave = async () => {
      if (!userData.username.trim() || (!editingUser && !userData.password.trim())) {
        setFormError('Username and password are required.'); return;
      }
      setFormError('');
      try {
        if (editingUser) {
          const userToUpdate = { ...editingUser, role: userData.role };
          if(userData.password) userToUpdate.password = userData.password;
          await onUpdateUser(userToUpdate);
        } else {
          await onAddUser(userData);
        }
        closeFormModal();
      } catch (error) {
        setFormError(error instanceof Error ? error.message : 'An error occurred.');
      }
    };
    
    const handleDelete = (id: string) => { if(window.confirm('Are you sure you want to delete this user?')) onDeleteUser(id); }

    const inputClasses = "w-full bg-brand-surface dark:bg-[#374151] border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-primary";

    return (
       <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-brand-header dark:bg-[#111827] rounded-lg shadow-xl p-5 w-full max-w-md max-h-[80vh] flex flex-col">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Manage Users</h2>
                <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2">
                  {users.map((u) => (
                    <div key={u.id} className="bg-brand-surface dark:bg-[#374151] p-3 rounded-md flex justify-between items-center">
                      <p className="font-semibold text-gray-900 dark:text-white">{u.username} <span className="text-sm font-normal text-gray-500">({u.role})</span></p>
                      {u.id !== currentUser?.id && (
                        <div className="space-x-2">
                          <button onClick={() => openFormModal(u)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm">Edit</button>
                          <button onClick={() => handleDelete(u.id)} className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 text-sm">Delete</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                 <button onClick={() => openFormModal()} className="w-full bg-brand-secondary text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-700 transition">Add New User</button>
                 <button onClick={() => setIsUserModalOpen(false)} className="w-full mt-4 p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-800 rounded-md transition">Close</button>
            </div>
            
            {isFormModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[60] p-4">
                <div className="bg-brand-surface dark:bg-[#374151] rounded-lg shadow-xl p-5 w-full max-w-sm space-y-3">
                  <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{editingUser ? 'Edit User' : 'Add User'}</h2>
                  <input type="text" value={userData.username} onChange={(e) => setUserData(d => ({...d, username: e.target.value}))} className={inputClasses} placeholder="Username" />
                   <div className="relative">
                     <input type={showPassword ? 'text' : 'password'} value={userData.password} onChange={(e) => setUserData(d => ({...d, password: e.target.value}))} className={inputClasses} placeholder={editingUser ? "New Password (optional)" : "Password"}/>
                     <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400"><span className="sr-only">Toggle password visibility</span>{showPassword ? <EyeOffIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}</button>
                   </div>
                  <select value={userData.role} onChange={(e) => setUserData(d => ({...d, role: e.target.value as any}))} className={inputClasses}><option value="Cashier">Cashier</option><option value="Admin">Admin</option></select>
                  {formError && <p className="text-sm text-red-500">{formError}</p>}
                  <div className="flex justify-end space-x-4 pt-4">
                    <button onClick={closeFormModal} className="px-4 py-2 bg-brand-header dark:bg-[#111827] border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-100">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-blue-700 font-semibold">Save</button>
                  </div>
                </div>
              </div>
            )}
        </div>
    )
  }

  return (
    <div className="p-3">
      {isTechModalOpen && <StaffManagerModal staff={technicians} onSaveNew={onAddTechnician} onSaveUpdate={onUpdateTechnician} onDelete={onDeleteTechnician} staffType="Technician" onClose={() => setIsTechModalOpen(false)} />}
      {isCsrModalOpen && <StaffManagerModal staff={csrs} onSaveNew={onAddCsr} onSaveUpdate={onUpdateCsr} onDelete={onDeleteCsr} staffType="CSR" onClose={() => setIsCsrModalOpen(false)} />}
      {isUserModalOpen && <UserManagerModal />}
      
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>
      <div className="space-y-3">
        <div className="bg-brand-surface dark:bg-[#374151] p-3 rounded-lg">
          <h2 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">User Account</h2>
          {currentUser && (<p className="text-gray-700 dark:text-gray-300">Logged in as: <span className="font-medium text-brand-primary">{currentUser.username} ({currentUser.role})</span></p>)}
           <button onClick={onLogout} className="mt-2 bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition">Logout</button>
        </div>

        <div className="bg-brand-surface dark:bg-[#374151] p-3 rounded-lg">
          <h2 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Appearance</h2>
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-700 dark:text-gray-300">Theme</span>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">Light</span>
              <button type="button" onClick={toggleTheme} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-primary ${theme === 'dark' ? 'bg-brand-primary' : 'bg-gray-300'}`} role="switch" aria-checked={theme === 'dark'}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
              <span className="text-sm text-gray-500">Dark</span>
            </div>
          </div>
        </div>

        {isAdmin && (
        <>
            <div className="bg-brand-surface dark:bg-[#374151] p-3 rounded-lg">
                <h2 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Administration</h2>
                <div className="flex flex-col sm:flex-row gap-2">
                    <button onClick={() => setIsUserModalOpen(true)} className="inline-flex items-center justify-center gap-2 bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition"><UsersIcon className="h-5 w-5" /> Manage Users</button>
                    <button onClick={() => setIsTechModalOpen(true)} className="inline-flex items-center justify-center gap-2 bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition"><UsersIcon className="h-5 w-5" /> Manage Technicians</button>
                    <button onClick={() => setIsCsrModalOpen(true)} className="inline-flex items-center justify-center gap-2 bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition"><UsersIcon className="h-5 w-5" /> Manage CSRs</button>
                </div>
            </div>

            <div className="bg-brand-surface dark:bg-[#374151] p-3 rounded-lg">
              <h2 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Data Management</h2>
              <div className="space-y-4">
                <div>
                    <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Export Data / Download Templates</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Download your current data in an Excel format. You can edit this file and re-upload it to sync changes.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <button onClick={() => onExportData('sales')} className="inline-flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition text-sm"><DownloadIcon className="h-4 w-4" /> Sales</button>
                        <button onClick={() => onExportData('purchases')} className="inline-flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition text-sm"><DownloadIcon className="h-4 w-4" /> Purchases</button>
                        <button onClick={() => onExportData('suppliers')} className="inline-flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition text-sm"><DownloadIcon className="h-4 w-4" /> Suppliers</button>
                        <button onClick={() => onExportData('technicians')} className="inline-flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition text-sm"><DownloadIcon className="h-4 w-4" /> Technicians</button>
                         <button onClick={() => onExportData('csrs')} className="inline-flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition text-sm"><DownloadIcon className="h-4 w-4" /> CSRs</button>
                    </div>
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                    <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Import & Sync Data</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Upload a compatible Excel file (.xlsx) to add or update records. Ensure the sheet names and columns match the downloaded templates.</p>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                         <input type="file" id="file-upload" accept=".xlsx, .xls" onChange={handleFileChange} className="hidden" />
                          <label htmlFor="file-upload" className="w-full sm:w-auto cursor-pointer px-4 py-2 bg-brand-surface dark:bg-[#374151] border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition text-center truncate">{selectedFile ? selectedFile.name : 'Choose a file...'}</label>
                        <button onClick={handleImportClick} disabled={!selectedFile || isImporting} className="w-full sm:w-auto px-4 py-2 bg-brand-secondary text-white rounded-md hover:bg-orange-700 transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed">{isImporting ? 'Importing...' : 'Upload & Sync'}</button>
                    </div>
                     {importStatus && (<p className={`mt-3 text-sm font-medium ${importStatus.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{importStatus.message}</p>)}
                </div>
              </div>
            </div>
        </>
        )}

        <div className="bg-brand-surface dark:bg-[#374151] p-3 rounded-lg">
          <h2 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Application</h2>
           <a href="/app.apk" download="GSMArenaPOS.apk" className="inline-flex items-center gap-2 bg-brand-secondary text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-700 transition"><ShareIcon className="h-5 w-5" /> Download APK</a>
        </div>
      </div>
    </div>
  );
};
