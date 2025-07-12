import React from 'react';
import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useUnits } from '../../contexts/UnitContext';
import { useTheme } from '../../contexts/ThemeContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const DiagramCharts = ({ beamData, results }) => {
  const { convertValue, getUnit } = useUnits();
  const { isDarkMode } = useTheme();
  const [chartKey, setChartKey] = useState(0);

  // Force chart re-render when theme changes
  useEffect(() => {
    setChartKey(prev => prev + 1);
  }, [isDarkMode]);

  // Dynamic chart options based on theme
  const getChartOptions = (yAxisLabel) => ({
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: window.innerWidth < 768 ? 1.2 : 2,
    plugins: {
      legend: {
        display: false,
        labels: {
          color: isDarkMode ? '#e5e7eb' : '#374151'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: isDarkMode ? '#374151' : '#ffffff',
        titleColor: isDarkMode ? '#e5e7eb' : '#374151',
        bodyColor: isDarkMode ? '#e5e7eb' : '#374151',
        borderColor: isDarkMode ? '#6b7280' : '#d1d5db',
        borderWidth: 1,
        callbacks: {
          title: function(context) {
            const xValue = parseFloat(context[0].label);
            const displayX = convertValue(xValue, 'length', 'SI');
            return `Position: ${displayX.toFixed(2)} ${getUnit('length')}`;
          },
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(3)}`;
          }
        }
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: `Position along beam (${getUnit('length')})`,
          color: isDarkMode ? '#e5e7eb' : '#374151',
          font: {
            size: window.innerWidth < 768 ? 12 : 14,
            weight: 'bold'
          }
        },
        grid: {
          display: true,
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: isDarkMode ? '#d1d5db' : '#6b7280',
          font: {
            size: window.innerWidth < 768 ? 10 : 12
          },
          maxTicksLimit: window.innerWidth < 768 ? 6 : 10
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: yAxisLabel,
          color: isDarkMode ? '#e5e7eb' : '#374151',
          font: {
            size: window.innerWidth < 768 ? 12 : 14,
            weight: 'bold'
          }
        },
        grid: {
          display: true,
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: isDarkMode ? '#d1d5db' : '#6b7280',
          font: {
            size: window.innerWidth < 768 ? 10 : 12
          },
          maxTicksLimit: window.innerWidth < 768 ? 6 : 8
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  });

  // Convert data for display
  const displayXCoords = results.shearForce.x.map(x => convertValue(x, 'length', 'SI'));
  const displayShearForce = results.shearForce.y.map(y => convertValue(y, 'force', 'SI'));
  const displayBendingMoment = results.bendingMoment.y.map(y => convertValue(y, 'moment', 'SI'));
  const displayDeflection = results.deflection.y.map(y => convertValue(y * 1000, 'deflection', 'SI')); // Convert from m to mm first

  const shearForceData = {
    labels: displayXCoords.map(x => x.toFixed(2)),
    datasets: [
      {
        label: `Shear Force (${getUnit('force')})`,
        data: displayShearForce,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 4,
      }
    ]
  };

  const bendingMomentData = {
    labels: displayXCoords.map(x => x.toFixed(2)),
    datasets: [
      {
        label: `Bending Moment (${getUnit('moment')})`,
        data: displayBendingMoment,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 4,
      }
    ]
  };

  const deflectionData = {
    labels: displayXCoords.map(x => x.toFixed(2)),
    datasets: [
      {
        label: `Deflection (${getUnit('deflection')})`,
        data: displayDeflection,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 4,
      }
    ]
  };

  const findMaxValues = () => {
    const maxShear = Math.max(...displayShearForce.map(Math.abs));
    const maxMoment = Math.max(...displayBendingMoment.map(Math.abs));
    const maxDeflection = Math.max(...displayDeflection.map(Math.abs));
    
    const maxShearIndex = displayShearForce.findIndex(v => Math.abs(v) === maxShear);
    const maxMomentIndex = displayBendingMoment.findIndex(v => Math.abs(v) === maxMoment);
    const maxDeflectionIndex = displayDeflection.findIndex(v => Math.abs(v) === maxDeflection);

    return {
      maxShear: {
        value: displayShearForce[maxShearIndex],
        position: displayXCoords[maxShearIndex]
      },
      maxMoment: {
        value: displayBendingMoment[maxMomentIndex],
        position: displayXCoords[maxMomentIndex]
      },
      maxDeflection: {
        value: displayDeflection[maxDeflectionIndex],
        position: displayXCoords[maxDeflectionIndex]
      }
    };
  };

  const maxValues = results.shearForce.x.length > 0 ? findMaxValues() : null;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {maxValues && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 mb-6">
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800 card-hover">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h4 className="font-bold text-blue-900 dark:text-blue-200">Maximum Shear Force</h4>
            </div>
            <div className="text-xl lg:text-2xl font-black text-blue-700 dark:text-blue-300 mb-1">
              {Math.abs(maxValues.maxShear.value).toFixed(2)} {getUnit('force')}
            </div>
            <div className="text-xs lg:text-sm text-blue-600 dark:text-blue-400 font-medium">
              at position {maxValues.maxShear.position.toFixed(2)} {getUnit('length')}
            </div>
          </div>
          <div className="card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800 card-hover">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h4 className="font-bold text-green-900 dark:text-green-200">Maximum Bending Moment</h4>
            </div>
            <div className="text-xl lg:text-2xl font-black text-green-700 dark:text-green-300 mb-1">
              {Math.abs(maxValues.maxMoment.value).toFixed(2)} {getUnit('moment')}
            </div>
            <div className="text-xs lg:text-sm text-green-600 dark:text-green-400 font-medium">
              at position {maxValues.maxMoment.position.toFixed(2)} {getUnit('length')}
            </div>
          </div>
          <div className="card bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800 card-hover sm:col-span-2 lg:col-span-1">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
              <h4 className="font-bold text-red-900 dark:text-red-200">Maximum Deflection</h4>
            </div>
            <div className="text-xl lg:text-2xl font-black text-red-700 dark:text-red-300 mb-1">
              {Math.abs(maxValues.maxDeflection.value).toFixed(2)} {getUnit('deflection')}
            </div>
            <div className="text-xs lg:text-sm text-red-600 dark:text-red-400 font-medium">
              at position {maxValues.maxDeflection.position.toFixed(2)} {getUnit('length')}
            </div>
          </div>
        </div>
      )}

      {/* Shear Force Diagram */}
      <div className="card">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white">Shear Force Diagram (SFD)</h3>
        </div>
        <div className="h-64 lg:h-80 bg-white dark:bg-gray-800 rounded-xl p-2 lg:p-4 border border-gray-200 dark:border-gray-700">
          {results.shearForce.x.length > 0 ? (
            <Line 
              key={`sfd-${chartKey}`}
              data={shearForceData} 
              options={getChartOptions(`Shear Force (${getUnit('force')})`)} 
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p>No data to display</p>
                <p className="text-sm">Configure beam parameters to see the shear force diagram</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bending Moment Diagram */}
      <div className="card">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h3 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white">Bending Moment Diagram (BMD)</h3>
        </div>
        <div className="h-64 lg:h-80 bg-white dark:bg-gray-800 rounded-xl p-2 lg:p-4 border border-gray-200 dark:border-gray-700">
          {results.bendingMoment.x.length > 0 ? (
            <Line 
              key={`bmd-${chartKey}`}
              data={bendingMomentData} 
              options={getChartOptions(`Bending Moment (${getUnit('moment')})`)} 
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p>No data to display</p>
                <p className="text-sm">Configure beam parameters to see the bending moment diagram</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Deflection Diagram */}
      <div className="card">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
          <h3 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white">Deflection Diagram</h3>
        </div>
        <div className="h-64 lg:h-80 bg-white dark:bg-gray-800 rounded-xl p-2 lg:p-4 border border-gray-200 dark:border-gray-700">
          {results.deflection.x.length > 0 ? (
            <Line 
              key={`deflection-${chartKey}`}
              data={deflectionData} 
              options={getChartOptions(`Deflection (${getUnit('deflection')})`)} 
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <p>No data to display</p>
                <p className="text-sm">Configure beam parameters to see the deflection diagram</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiagramCharts;