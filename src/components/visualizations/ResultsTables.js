import React from 'react';
import { useUnits } from '../../contexts/UnitContext';

const ResultsTables = ({ beamData, results }) => {
  const { convertValue, getUnit } = useUnits();

  const generateCombinedTableData = () => {
    if (results.shearForce.x.length === 0) return [];
    const tableData = [];
    // Convert 1 unit in current system to SI for comparison
    const siInterval = convertValue(1.0, 'length', null, 'SI');
    const beamLengthSI = convertValue(beamData.length, 'length', null, 'SI');
    const numSteps = Math.floor(beamLengthSI / siInterval);
    // Collect all interval positions (in SI)
    const intervalPositions = [];
    for (let i = 0; i <= numSteps; i++) {
      intervalPositions.push(i * siInterval);
    }
    if (intervalPositions[intervalPositions.length - 1] < beamLengthSI - 1e-6) {
      intervalPositions.push(beamLengthSI); // Always include beam end
    }
    // For each interval position, find the closest x in results.shearForce.x
    intervalPositions.forEach((targetX) => {
      let closestIdx = 0;
      let minDiff = Math.abs(results.shearForce.x[0] - targetX);
      for (let i = 1; i < results.shearForce.x.length; i++) {
        const diff = Math.abs(results.shearForce.x[i] - targetX);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = i;
        }
      }
      const x = results.shearForce.x[closestIdx];
      const displayX = convertValue(x, 'length', 'SI');
      const displayShear = convertValue(results.shearForce.y[closestIdx], 'force', 'SI');
      const displayMoment = convertValue(results.bendingMoment.y[closestIdx], 'moment', 'SI');
      const displayDeflection = convertValue(results.deflection.y[closestIdx] * 1000, 'deflection', 'SI'); // Convert from m to mm first
        tableData.push({
          position: displayX.toFixed(2),
          shearForce: displayShear.toFixed(4),
          bendingMoment: displayMoment.toFixed(4),
          deflection: displayDeflection.toFixed(4)
        });
    });
    return tableData;
  };

  const combinedTable = generateCombinedTableData();

  return (
    <div className="space-y-6">
      {/* Reactions Summary */}
      {results.reactions.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Reaction Forces Summary</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Support Position ({getUnit('length')})
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Support Type
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Vertical Force ({getUnit('force')})
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Moment ({getUnit('moment')})
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {results.reactions.map((reaction, index) => {
                  const support = beamData.supports.find(s => s.position === reaction.position);
                  const displayPos = convertValue(reaction.position, 'length', 'SI');
                  const displayForce = convertValue(reaction.force, 'force', 'SI');
                  const displayMoment = reaction.moment !== undefined ? convertValue(reaction.moment, 'moment', 'SI') : undefined;
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {displayPos.toFixed(2)}
                      </td>
                      <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {support?.type || 'Unknown'}
                      </td>
                      <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        <span className={reaction.force < 0 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}>
                          {Math.abs(displayForce).toFixed(3)} {reaction.force < 0 ? '↓' : '↑'}
                        </span>
                      </td>
                      <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {displayMoment !== undefined ? (
                          <span className={reaction.moment < 0 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}>
                            {Math.abs(displayMoment).toFixed(3)} {reaction.moment > 0 ? '↻' : '↺'}
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Combined Results Table */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Analysis Results (every 1 {getUnit('length')} interval)</h3>
        {combinedTable.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Position ({getUnit('length')})
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                    Shear Force ({getUnit('force')})
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-green-700 dark:text-green-300 uppercase tracking-wider">
                    Bending Moment ({getUnit('moment')})
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-red-700 dark:text-red-300 uppercase tracking-wider">
                    Deflection ({getUnit('deflection')})
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {combinedTable.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {row.position}
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      <span className={parseFloat(row.shearForce) < 0 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}>
                        {row.shearForce}
                      </span>
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      <span className={parseFloat(row.bendingMoment) < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                        {row.bendingMoment}
                      </span>
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      <span className={parseFloat(row.deflection) < 0 ? 'text-red-600 dark:text-red-400' : 'text-red-600 dark:text-red-400'}>
                        {row.deflection}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No analysis data available</p>
            <p className="text-sm">Configure beam parameters to see the results</p>
          </div>
        )}
      </div>

      {/* Material Properties Summary */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Material Properties</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Young's Modulus (E)</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {convertValue(beamData.materialProperties.E, 'stress', 'SI').toExponential(2)} {getUnit('stress')}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Moment of Inertia (I)</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {convertValue(beamData.materialProperties.I, 'inertia', 'SI').toExponential(2)} {getUnit('inertia')}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Flexural Rigidity (EI)</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {convertValue(beamData.materialProperties.E * beamData.materialProperties.I, 'moment', 'SI').toExponential(2)} {getUnit('moment')}
            </div>
          </div>
        </div>
      </div>

      {/* Load Information */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Load Information</h3>
        <div className="space-y-2 text-sm">
          {beamData.pointLoads.map((load, idx) => {
            const displayPos = convertValue(load.position, 'length', 'SI');
            const displayMag = convertValue(load.magnitude, 'force', 'SI');
            const isInclined = load.isInclined || false;
            const angle = load.angle || 0;
            
            return (
              <div key={idx} className="flex justify-between">
                <span>Point Load {idx + 1}:</span>
                <span>
                  {Math.abs(displayMag).toFixed(2)} {getUnit('force')} 
                  {isInclined && ` (∠${angle}°)`} 
                  at {displayPos.toFixed(2)} {getUnit('length')}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ResultsTables;