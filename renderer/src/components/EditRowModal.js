import React, { useState } from 'react';

const EditRowModal = ({ row, columns, schema, pkColumn, onSave, onClose }) => {
  const [formData, setFormData] = useState({ ...row });

  const handleChange = (column, value) => {
    setFormData(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const rowId = row[pkColumn.name];
    
    // Only send changed fields
    const changedData = {};
    columns.forEach(column => {
      if (formData[column] !== row[column]) {
        changedData[column] = formData[column];
      }
    });
    
    if (Object.keys(changedData).length > 0) {
      onSave(rowId, changedData);
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
          <h3 className="text-xl font-semibold text-gray-800">Edit Row</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-4">
            {columns.map((column) => {
              const columnSchema = schema.find(col => col.name === column);
              const isPrimaryKey = columnSchema.primaryKey === true;
              
              return (
                <div key={column}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {column}
                    {isPrimaryKey && <span className="ml-1 text-xs text-blue-600">(Primary Key)</span>}
                  </label>
                  {formData[column] !== null && String(formData[column]).length > 100 ? (
                    <textarea
                      value={formData[column] || ''}
                      onChange={(e) => handleChange(column, e.target.value)}
                      disabled={isPrimaryKey}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 font-mono text-sm"
                      rows="4"
                    />
                  ) : (
                    <input
                      type={getInputType(columnSchema)}
                      value={formData[column] !== null ? formData[column] : ''}
                      onChange={(e) => handleChange(column, e.target.value)}
                      disabled={isPrimaryKey}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 font-mono text-sm"
                    />
                  )}
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
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRowModal;
