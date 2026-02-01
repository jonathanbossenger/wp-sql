import React from 'react';
import { CircleStackIcon, ServerIcon } from '@heroicons/react/24/outline';

const DatabaseTypeSelector = ({ onSelectType, isSelecting }) => {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">
        Choose Database Type
      </h3>
      <p className="text-gray-600 mb-6 text-center">
        This directory has both SQLite and MySQL databases. Which would you like to view?
      </p>
      
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onSelectType('sqlite')}
          disabled={isSelecting}
          className="flex flex-col items-center p-6 border-2 border-blue-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <CircleStackIcon className="w-16 h-16 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
          <h4 className="text-lg font-semibold text-gray-800 mb-2">SQLite</h4>
          <p className="text-sm text-gray-600 text-center">
            WordPress Studio database
          </p>
          <p className="text-xs text-gray-500 mt-2">
            .ht.sqlite file
          </p>
        </button>

        <button
          onClick={() => onSelectType('mysql')}
          disabled={isSelecting}
          className="flex flex-col items-center p-6 border-2 border-green-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <ServerIcon className="w-16 h-16 text-green-500 mb-3 group-hover:scale-110 transition-transform" />
          <h4 className="text-lg font-semibold text-gray-800 mb-2">MySQL</h4>
          <p className="text-sm text-gray-600 text-center">
            Traditional WordPress database
          </p>
          <p className="text-xs text-gray-500 mt-2">
            wp-config.php credentials
          </p>
        </button>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> You can change this selection later by selecting a different directory.
        </p>
      </div>
    </div>
  );
};

export default DatabaseTypeSelector;
