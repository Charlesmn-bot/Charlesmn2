
import React, { useState } from 'react';
import { Technician } from '../types';
import { UsersIcon } from './icons/UsersIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';

interface TechniciansProps {
  technicians: Technician[];
  onAdd: (name: string) => void;
  onUpdate: (technician: Technician) => void;
  onDelete: (id: string) => void;
}

export const Technicians: React.FC<TechniciansProps> = ({ technicians, onAdd, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTech, setEditingTech] = useState<Technician | null>(null);
  const [techName, setTechName] = useState('');

  const openModal = (tech: Technician | null = null) => {
    setEditingTech(tech);
    setTechName(tech ? tech.name : '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTech(null);
    setTechName('');
  };

  const handleSave = () => {
    if (techName.trim() === '') return;
    if (editingTech) {
      onUpdate({ ...editingTech, name: techName });
    } else {
      onAdd(techName);
    }
    closeModal();
  };
  
  const handleDelete = (id: string) => {
      if(window.confirm("Are you sure you want to delete this technician? This cannot be undone.")) {
          onDelete(id);
      }
  }

  const inputClasses = "w-full bg-brand-surface dark:bg-[#374151] border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition";

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Manage Technicians</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {technicians.map((tech) => (
          <div key={tech.id} className="bg-brand-surface dark:bg-[#374151] p-4 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-brand-primary p-3 rounded-full">
                  <UsersIcon className="h-6 w-6 text-white"/>
              </div>
              <span className="text-lg font-medium text-gray-900 dark:text-white">{tech.name}</span>
            </div>
            <div className="space-x-2">
                <button onClick={() => openModal(tech)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Edit</button>
                <button onClick={() => handleDelete(tech.id)} className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300">Delete</button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 text-center">
        <button onClick={() => openModal()} className="inline-flex items-center gap-2 bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition">
          <PlusCircleIcon className="h-6 w-6" /> Add New Technician
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-brand-header dark:bg-[#111827] rounded-lg shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{editingTech ? 'Edit Technician' : 'Add Technician'}</h2>
            <input
              type="text"
              value={techName}
              onChange={(e) => setTechName(e.target.value)}
              className={inputClasses}
              placeholder="Technician's Name"
            />
            <div className="flex justify-end space-x-4 mt-6">
              <button onClick={closeModal} className="px-4 py-2 bg-brand-surface dark:bg-[#374151] border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-blue-700 transition font-semibold">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};