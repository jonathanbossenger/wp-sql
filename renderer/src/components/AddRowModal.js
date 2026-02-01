import React, { useState } from 'react';

const AddRowModal = ({ columns, schema, pkColumn, onSave, onClose }) => {
  // Helper function to determine if a field should be shown in the form
  const shouldShowField = (columnSchema) => {
    // Don't show auto-increment primary keys
    if (columnSchema.primaryKey === true) {
      const type = columnSchema.type.toLowerCase();
      // For SQLite, INTEGER PRIMARY KEY is auto-increment by default
      // For MySQL, check for AUTO_INCREMENT in type or default value
      if (type.includes('integer') || type.includes('auto_increment')) {
        return false;
      }
    }
    return true;
  };

  // Initialize form data with empty values for visible fields only
  const initialFormData = {};
  columns.forEach(column => {
    const columnSchema = schema.find(col => col.name === column);
    if (shouldShowField(columnSchema)) {
      initialFormData[column] = '';
    }
  });

  const [formData, setFormData] = useState(initialFormData);

  const handleChange = (column, value) => {
    setFormData(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Prepare data for insertion
    const insertData = {};
    Object.keys(formData).forEach(column => {
      const value = formData[column];
      // Only include non-empty values
      if (value !== '') {
        insertData[column] = value;
      }
    });
    
    if (Object.keys(insertData).length > 0) {
      onSave(insertData);
    } else {
      onClose();
    }
  };

  const getInputType = (columnSchema) => {
    const type = columnSchema.type.toLowerCase();
    if (type.includes('int') || type.includes('real') || type.includes('numeric')) {
      return 'number';
    }
    return 'text';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">Add New Row</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-4">
            {columns.map((column) => {
              const columnSchema = schema.find(col => col.name === column);
              const isPrimaryKey = columnSchema.primaryKey === true;
              
              if (!shouldShowField(columnSchema)) {
                return null;
              }
              
              return (
                <div key={column}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {column}
                    {isPrimaryKey && <span className="ml-1 text-xs text-blue-600">(Primary Key)</span>}
                    {columnSchema.notnull === 1 && <span className="ml-1 text-xs text-red-600">*</span>}
                  </label>
                  <input
                    type={getInputType(columnSchema)}
                    value={formData[column] || ''}
                    onChange={(e) => handleChange(column, e.target.value)}
                    placeholder={columnSchema.dflt_value ? `Default: ${columnSchema.dflt_value}` : ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  />
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-200"
            >
              Add Row
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRowModal;
