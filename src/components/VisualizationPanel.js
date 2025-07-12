import React, { useState } from 'react';
import BeamDiagram from './visualizations/BeamDiagram';
import DiagramCharts from './visualizations/DiagramCharts';
import StressAnalysis from './visualizations/StressAnalysis';
import ResultsTables from './visualizations/ResultsTables';
import { useUnits } from '../contexts/UnitContext';

const VisualizationPanel = ({ beamData, results }) => {
  const [activeView, setActiveView] = useState('diagram');
  const { convertValue, getUnit } = useUnits();

  const views = [
    { id: 'diagram', label: 'Beam Diagram', icon: '🏗️' },
    { id: 'charts', label: 'SFD, BMD & Deflection', icon: '📊' },
    { id: 'stress', label: 'Stress Analysis', icon: '📐' },
    { id: 'tables', label: 'Results Tables', icon: '📋' }
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'diagram':
        return <BeamDiagram beamData={beamData} results={results} />;
      case 'charts':
        return <DiagramCharts beamData={beamData} results={results} />;
      case 'stress':
        return <StressAnalysis beamData={beamData} results={results} />;
      case 'tables':
        return <ResultsTables beamData={beamData} results={results} />;
      default:
        return null;
    }
  };

  const displayLength = convertValue(beamData.length, 'length', 'SI');

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 transition-colors overflow-hidden">
      <div className="border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-4 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 flex-shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex space-x-1 lg:space-x-2 overflow-x-auto mobile-scroll pb-2 lg:pb-0">
            {views.map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                className={`px-3 lg:px-4 py-2 lg:py-3 text-sm font-semibold rounded-xl transition-all duration-200 whitespace-nowrap shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95 ${
                  activeView === view.id
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
                }`}
              >
                <span className="mr-1 lg:mr-2 text-base">{view.icon}</span>
                <span className="hidden sm:inline lg:inline">{view.label}</span>
                <span className="sm:hidden lg:hidden">{view.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
          
          <div className="flex items-center space-x-2 lg:space-x-4 text-xs lg:text-sm text-gray-500 dark:text-gray-400 overflow-x-auto bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-xl">
            <div className="flex items-center space-x-1">
              <span className="font-medium">Length:</span>
              <span className="text-gray-700 dark:text-gray-300">{displayLength.toFixed(2)} {getUnit('length')}</span>
            </div>
            <span className="hidden sm:inline text-gray-300 dark:text-gray-600">•</span>
            <div className="flex items-center space-x-1">
              <span className="font-medium">Supports:</span>
              <span className="text-gray-700 dark:text-gray-300">{beamData.supports.length}</span>
            </div>
            <span className="hidden sm:inline text-gray-300 dark:text-gray-600">•</span>
            <div className="flex items-center space-x-1">
              <span className="font-medium">Loads:</span>
              <span className="text-gray-700 dark:text-gray-300">{beamData.pointLoads.length + beamData.distributedLoads.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 lg:p-6 mobile-scroll bg-gray-50 dark:bg-gray-900">
        <div className="animate-fade-in">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default VisualizationPanel;