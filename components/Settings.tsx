
import React, { useState } from 'react';
import { Technician, CustomerServiceRepresentative, User } from '../types';
import { CogIcon } from './icons/CogIcon';
import { ShareIcon } from './icons/ShareIcon';
import { UsersIcon } from './icons/UsersIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';

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
    currentUser: User | null;
}

export const Settings: React.FC<SettingsProps> = ({ onLogout, technicians, onAddTechnician, onUpdateTechnician, onDeleteTechnician, csrs, onAddCsr, onUpdateCsr, onDeleteCsr, theme, toggleTheme, currentUser }) => {
  const [isTechModalOpen, setIsTechModalOpen] = useState(false);
  const [isCsrModalOpen, setIsCsrModalOpen] = useState(false);

  // Technician Manager Modal Component
  const TechnicianManagerModal = () => {
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [editingTech, setEditingTech] = useState<Technician | null>(null);
    const [techName, setTechName] = useState('');

    const openFormModal = (tech: Technician | null = null) => {
      setEditingTech(tech);
      setTechName(tech ? tech.name : '');
      setFormModalOpen(true);
    };

    const closeFormModal = () => {
      setFormModalOpen(false);
      setEditingTech(null);
      setTechName('');
    };

    const handleSave = () => {
      if (techName.trim() === '') return;
      if (editingTech) {
        onUpdateTechnician({ ...editingTech, name: techName });
      } else {
        onAddTechnician(techName);
      }
      closeFormModal();
    };
    
    const handleDelete = (id: string) => {
        if(window.confirm("Are you sure you want to delete this technician? This cannot be undone.")) {
            onDeleteTechnician(id);
        }
    }

    const sortedTechnicians = [...technicians].sort((a, b) => a.name.localeCompare(b.name));

    const inputClasses = "w-full bg-brand-surface dark:bg-[#374151] border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition";

    return (
       <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-brand-header dark:bg-[#111827] rounded-lg shadow-xl p-5 w-full max-w-md max-h-[80vh] flex flex-col">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Manage Technicians</h2>
                <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                  {sortedTechnicians.map((tech) => (
                    <div key={tech.id} className="bg-brand-surface dark:bg-[#374151] p-3 rounded-md flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{tech.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">ID: {tech.id}</p>
                      </div>
                      <div className="space-x-2">
                          <button onClick={() => openFormModal(tech)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm">Edit</button>
                          <button onClick={() => handleDelete(tech.id)} className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 text-sm">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
                 <button onClick={() => openFormModal()} className="w-full bg-brand-secondary text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-700 transition">Add New Technician</button>
                 <button onClick={() => setIsTechModalOpen(false)} className="w-full mt-4 p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-800 rounded-md transition text-gray-600 dark:text-gray-300">Close</button>
            </div>
            
            {isFormModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[60] p-4">
                <div className="bg-brand-surface dark:bg-[#374151] rounded-lg shadow-xl p-5 w-full max-w-sm">
                  <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{editingTech ? 'Edit Technician' : 'Add Technician'}</h2>
                  <input
                    type="text"
                    value={techName}
                    onChange={(e) => setTechName(e.target.value)}
                    className={inputClasses}
                    placeholder="Technician's Name"
                  />
                  <div className="flex justify-end space-x-4 mt-6">
                    <button onClick={closeFormModal} className="px-4 py-2 bg-brand-header dark:bg-[#111827] border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-blue-700 transition font-semibold">Save</button>
                  </div>
                </div>
              </div>
            )}
        </div>
    )
  }

  // Customer Service Representative Manager Modal Component
  const CsrManagerModal = () => {
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [editingCsr, setEditingCsr] = useState<CustomerServiceRepresentative | null>(null);
    const [csrName, setCsrName] = useState('');

    const openFormModal = (csr: CustomerServiceRepresentative | null = null) => {
      setEditingCsr(csr);
      setCsrName(csr ? csr.name : '');
      setFormModalOpen(true);
    };

    const closeFormModal = () => {
      setFormModalOpen(false);
      setEditingCsr(null);
      setCsrName('');
    };

    const handleSave = () => {
      if (csrName.trim() === '') return;
      if (editingCsr) {
        onUpdateCsr({ ...editingCsr, name: csrName });
      } else {
        onAddCsr(csrName);
      }
      closeFormModal();
    };
    
    const handleDelete = (id: string) => {
        if(window.confirm("Are you sure you want to delete this CSR? This cannot be undone.")) {
            onDeleteCsr(id);
        }
    }

    const sortedCsrs = [...csrs].sort((a, b) => a.name.localeCompare(b.name));

    const inputClasses = "w-full bg-brand-surface dark:bg-[#374151] border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition";

    return (
       <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-brand-header dark:bg-[#111827] rounded-lg shadow-xl p-5 w-full max-w-md max-h-[80vh] flex flex-col">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Manage CSRs</h2>
                <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                  {sortedCsrs.map((csr) => (
                    <div key={csr.id} className="bg-brand-surface dark:bg-[#374151] p-3 rounded-md flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{csr.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">ID: {csr.id}</p>
                      </div>
                      <div className="space-x-2">
                          <button onClick={() => openFormModal(csr)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm">Edit</button>
                          <button onClick={() => handleDelete(csr.id)} className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 text-sm">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
                 <button onClick={() => openFormModal()} className="w-full bg-brand-secondary text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-700 transition">Add New CSR</button>
                 <button onClick={() => setIsCsrModalOpen(false)} className="w-full mt-4 p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-800 rounded-md transition text-gray-600 dark:text-gray-300">Close</button>
            </div>
            
            {isFormModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[60] p-4">
                <div className="bg-brand-surface dark:bg-[#374151] rounded-lg shadow-xl p-5 w-full max-w-sm">
                  <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{editingCsr ? 'Edit CSR' : 'Add CSR'}</h2>
                  <input
                    type="text"
                    value={csrName}
                    onChange={(e) => setCsrName(e.target.value)}
                    className={inputClasses}
                    placeholder="CSR's Name"
                  />
                  <div className="flex justify-end space-x-4 mt-6">
                    <button onClick={closeFormModal} className="px-4 py-2 bg-brand-header dark:bg-[#111827] border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-blue-700 transition font-semibold">Save</button>
                  </div>
                </div>
              </div>
            )}
        </div>
    )
  }

  return (
    <div className="p-3">
      {isTechModalOpen && <TechnicianManagerModal />}
      {isCsrModalOpen && <CsrManagerModal />}
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>
      <div className="space-y-3">
        <div className="bg-brand-surface dark:bg-[#374151] p-3 rounded-lg">
          <h2 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">User Account</h2>
          {currentUser && (
            <p className="text-gray-700 dark:text-gray-300">Logged in as: <span className="font-medium text-brand-primary">{currentUser.username} ({currentUser.role})</span></p>
          )}
           <button onClick={onLogout} className="mt-2 bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition">Logout</button>
        </div>
        <div className="bg-brand-surface dark:bg-[#374151] p-3 rounded-lg">
          <h2 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Appearance</h2>
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-700 dark:text-gray-300">Theme</span>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">Light</span>
              <button
                type="button"
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 dark:focus:ring-offset-[#374151] ${
                  theme === 'dark' ? 'bg-brand-primary' : 'bg-gray-300'
                }`}
                role="switch"
                aria-checked={theme === 'dark'}
              >
                <span className="sr-only">Use dark theme</span>
                <span
                  aria-hidden="true"
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-500">Dark</span>
            </div>
          </div>
        </div>
         <div className="bg-brand-surface dark:bg-[#374151] p-3 rounded-lg">
            <h2 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Staff Management</h2>
            <div className="flex flex-col sm:flex-row gap-2">
                <button onClick={() => setIsTechModalOpen(true)} className="inline-flex items-center justify-center gap-2 bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition">
                    <UsersIcon className="h-5 w-5" /> Manage Technicians
                </button>
                <button onClick={() => setIsCsrModalOpen(true)} className="inline-flex items-center justify-center gap-2 bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition">
                    <UsersIcon className="h-5 w-5" /> Manage CSRs
                </button>
            </div>
        </div>
        <div className="bg-brand-surface dark:bg-[#374151] p-3 rounded-lg">
          <h2 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Application</h2>
           <a 
            href="/app.apk"
            download="GSMArenaPOS.apk"
            className="inline-flex items-center gap-2 bg-brand-secondary text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-700 transition"
          >
            <ShareIcon className="h-5 w-5" />
            Download APK
          </a>
        </div>
        <div className="bg-brand-surface dark:bg-[#374151] p-3 rounded-lg">
          <h2 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Data Management</h2>
          <div className="flex space-x-2">
            <button className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition">Export to Excel</button>
            <button className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition">Export to PDF</button>
          </div>
        </div>
         <div className="bg-brand-surface dark:bg-[#374151] p-3 rounded-lg">
          <h2 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Offline Sync</h2>
          <p className="text-gray-500 dark:text-gray-400">Last synced: Just now</p>
          <button className="mt-2 bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition">Sync Now</button>
        </div>
      </div>
    </div>
  );
};
