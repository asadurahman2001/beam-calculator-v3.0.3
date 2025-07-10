import React, { useState } from 'react';
import { useUnits } from '../../contexts/UnitContext';

const SectionTab = ({ beamData, updateBeamData }) => {
  const [sectionType, setSectionType] = useState('rectangular');
  const [analysisPosition, setAnalysisPosition] = useState(beamData.length / 2);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { getUnit, convertValue } = useUnits();

  const updateSectionProperty = (property, value) => {
    const siValue = convertValue(value, 'sectionLength', null, 'SI');
    const newSection = {
      ...beamData.section,
      [property]: siValue
    };
    updateBeamData({
      section: newSection
    });
    setTimeout(() => calculateMomentOfInertiaForSection(newSection), 0);
  };

  const updateStressAnalysisSettings = (settings) => {
    updateBeamData({
      stressAnalysis: {
        ...beamData.stressAnalysis,
        ...settings
      }
    });
  };

  // Helper to calculate moment of inertia for a given section object
  const calculateMomentOfInertiaForSection = (section) => {
    let I = 0;
    switch (section.type || sectionType) {
      case 'rectangular':
        const b = section.width || 0.3;
        const h = section.height || 0.5;
        I = (b * Math.pow(h, 3)) / 12;
        break;
      case 'circular':
        const d = section.diameter || 0.4;
        I = (Math.PI * Math.pow(d, 4)) / 64;
        break;
      case 'i-beam':
        const bf = section.flangeWidth || 0.2;
        const tf = section.flangeThickness || 0.02;
        const hw = section.webHeight || 0.4;
        const tw = section.webThickness || 0.01;
        const totalHeight = hw + 2 * tf;
        const Iflange = 2 * ((bf * Math.pow(tf, 3)) / 12 + bf * tf * Math.pow((totalHeight / 2 - tf / 2), 2));
        const Iweb = (tw * Math.pow(hw, 3)) / 12;
        I = Iflange + Iweb;
        break;
      case 't-beam':
        const bfT = section.flangeWidth || 0.3;
        const tfT = section.flangeThickness || 0.05;
        const hwT = section.webHeight || 0.4;
        const twT = section.webThickness || 0.02;
        const totalHeightT = hwT + tfT;
        const A1 = bfT * tfT;
        const A2 = twT * hwT;
        const y1 = totalHeightT - tfT / 2;
        const y2 = hwT / 2;
        const yBar = (A1 * y1 + A2 * y2) / (A1 + A2);
        const I1 = (bfT * Math.pow(tfT, 3)) / 12 + A1 * Math.pow(y1 - yBar, 2);
        const I2 = (twT * Math.pow(hwT, 3)) / 12 + A2 * Math.pow(y2 - yBar, 2);
        I = I1 + I2;
        break;
      case 'custom':
        I = section.momentOfInertia || 1e-4;
        break;
      default:
        I = 1e-4;
    }
    updateBeamData({
      materialProperties: {
        ...beamData.materialProperties,
        I: I
      },
      section: section
    });
  };

  // Calculate section properties for stress analysis
  const calculateSectionProperties = () => {
    const section = beamData.section || {};
    let properties = {
      area: 0,
      momentOfInertia: 0,
      centroidHeight: 0,
      maxDistanceFromCentroid: 0,
      thickness: 0,
      firstMomentOfArea: 0
    };

    // Get dimensions in current display units
    const getDisplayDimension = (value) => convertValue(value || 0, 'sectionLength', 'SI');

    switch (section.type || sectionType) {
      case 'rectangular':
        const b = getDisplayDimension(section.width || 0.3);
        const h = getDisplayDimension(section.height || 0.5);
        properties.area = b * h;
        properties.momentOfInertia = (b * Math.pow(h, 3)) / 12;
        properties.centroidHeight = h / 2; // Neutral axis at h/2
        properties.maxDistanceFromCentroid = h / 2;
        properties.thickness = b;
        properties.firstMomentOfArea = (b * h * h) / 8; // Q for rectangular section
        break;
      case 'circular':
        const d = getDisplayDimension(section.diameter || 0.4);
        const r = d / 2;
        properties.area = Math.PI * r * r;
        properties.momentOfInertia = (Math.PI * Math.pow(d, 4)) / 64;
        properties.centroidHeight = r;
        properties.maxDistanceFromCentroid = r;
        properties.thickness = d;
        properties.firstMomentOfArea = (2 * r * r * r) / 3;
        break;
      case 'i-beam':
        const bf = getDisplayDimension(section.flangeWidth || 0.2);
        const tf = getDisplayDimension(section.flangeThickness || 0.02);
        const hw = getDisplayDimension(section.webHeight || 0.4);
        const tw = getDisplayDimension(section.webThickness || 0.01);
        const totalHeight = hw + 2 * tf;
        properties.area = 2 * bf * tf + tw * hw;
        const Iflange = 2 * ((bf * Math.pow(tf, 3)) / 12 + bf * tf * Math.pow((totalHeight / 2 - tf / 2), 2));
        const Iweb = (tw * Math.pow(hw, 3)) / 12;
        properties.momentOfInertia = Iflange + Iweb;
        properties.centroidHeight = totalHeight / 2;
        properties.maxDistanceFromCentroid = totalHeight / 2;
        properties.thickness = tw;
        properties.firstMomentOfArea = bf * tf * (totalHeight / 2 - tf / 2);
        break;
      case 't-beam':
        const bfT = getDisplayDimension(section.flangeWidth || 0.3);
        const tfT = getDisplayDimension(section.flangeThickness || 0.05);
        const hwT = getDisplayDimension(section.webHeight || 0.4);
        const twT = getDisplayDimension(section.webThickness || 0.02);
        const totalHeightT = hwT + tfT;
        
        const A1 = bfT * tfT;
        const A2 = twT * hwT;
        const y1 = totalHeightT - tfT / 2;
        const y2 = hwT / 2;
        const yBar = (A1 * y1 + A2 * y2) / (A1 + A2);
        
        properties.area = A1 + A2;
        const I1 = (bfT * Math.pow(tfT, 3)) / 12 + A1 * Math.pow(y1 - yBar, 2);
        const I2 = (twT * Math.pow(hwT, 3)) / 12 + A2 * Math.pow(y2 - yBar, 2);
        properties.momentOfInertia = I1 + I2;
        properties.centroidHeight = yBar;
        properties.maxDistanceFromCentroid = Math.max(yBar, totalHeightT - yBar);
        properties.thickness = twT;
        properties.firstMomentOfArea = A1 * Math.abs(y1 - yBar);
        break;
      default:
        properties.area = 0.15;
        properties.momentOfInertia = 0.01;
        properties.centroidHeight = 0.25;
        properties.maxDistanceFromCentroid = 0.25;
        properties.thickness = 0.3;
        properties.firstMomentOfArea = 0.01;
    }

    return properties;
  };

  // Update moment of inertia when section type changes
  const handleSectionTypeChange = (e) => {
    setSectionType(e.target.value);
    const newSection = { ...beamData.section, type: e.target.value };
    updateBeamData({ section: newSection });
    setTimeout(() => calculateMomentOfInertiaForSection(newSection), 0);
  };

  const sectionPresets = [
    { 
      name: 'Small Beam', 
      type: 'rectangular', 
      width: 0.2, 
      height: 0.3,
      description: '200×300mm rectangular section'
    },
    { 
      name: 'Medium Beam', 
      type: 'rectangular', 
      width: 0.3, 
      height: 0.5,
      description: '300×500mm rectangular section'
    },
    { 
      name: 'Large Beam', 
      type: 'rectangular', 
      width: 0.4, 
      height: 0.7,
      description: '400×700mm rectangular section'
    },
    { 
      name: 'Standard I-Beam', 
      type: 'i-beam', 
      flangeWidth: 0.2, 
      flangeThickness: 0.02, 
      webHeight: 0.4, 
      webThickness: 0.01,
      description: 'Standard steel I-beam'
    },
    { 
      name: 'Standard T-Beam', 
      type: 't-beam', 
      flangeWidth: 0.3, 
      flangeThickness: 0.05, 
      webHeight: 0.4, 
      webThickness: 0.02,
      description: 'Standard concrete T-beam'
    }
  ];

  const applyPreset = (preset) => {
    setSectionType(preset.type);
    const newSection = { type: preset.type };
    
    Object.keys(preset).forEach(key => {
      if (key !== 'name' && key !== 'description') {
        newSection[key] = preset[key];
      }
    });

    updateBeamData({
      section: newSection
    });

    // Recalculate moment of inertia
    setTimeout(() => calculateMomentOfInertiaForSection(newSection), 100);
  };

  const section = beamData.section || {};
  const currentSectionType = section.type || sectionType;
  const sectionProperties = calculateSectionProperties();
  const displayAnalysisPosition = convertValue(analysisPosition, 'length', 'SI');

  return (
    <div className="space-y-6 relative">
      {/* Settings Icon */}
      <button
        className="absolute top-0 right-0 mt-2 mr-4 z-10 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
        onClick={() => setSettingsOpen(true)}
        title="Stress Analysis Settings"
      >
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 8.6 15a1.65 1.65 0 0 0-1.82-.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 15 8.6a1.65 1.65 0 0 0 1.82.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 15z" />
        </svg>
      </button>

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              onClick={() => setSettingsOpen(false)}
              title="Close"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Stress Analysis Settings</h2>
            {/* Moved settings block here */}
            <div className="space-y-4">
              {/* Analysis Position Control */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Analysis Position: {displayAnalysisPosition.toFixed(2)} {getUnit('length')}
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max={convertValue(beamData.length, 'length', 'SI')}
                    step="0.1"
                    value={displayAnalysisPosition}
                    onChange={(e) => setAnalysisPosition(convertValue(parseFloat(e.target.value), 'length', null, 'SI'))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>0</span>
                    <span>{convertValue(beamData.length, 'length', 'SI').toFixed(1)} {getUnit('length')}</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={convertValue(beamData.length, 'length', 'SI')}
                    step="0.1"
                    value={displayAnalysisPosition}
                    onChange={(e) => setAnalysisPosition(convertValue(parseFloat(e.target.value) || 0, 'length', null, 'SI'))}
                    className="input-field w-32"
                  />
                </div>
              </div>

              {/* Stress Analysis Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stress Components to Analyze
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={beamData.stressAnalysis?.showBendingStress !== false}
                      onChange={(e) => updateStressAnalysisSettings({ showBendingStress: e.target.checked })}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Bending Stress (σ = M×y/I)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={beamData.stressAnalysis?.showShearStress !== false}
                      onChange={(e) => updateStressAnalysisSettings({ showShearStress: e.target.checked })}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Shear Stress (τ = V×Q/(I×b))</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={beamData.stressAnalysis?.showStressDistribution !== false}
                      onChange={(e) => updateStressAnalysisSettings({ showStressDistribution: e.target.checked })}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Cross-Section Stress Distribution</span>
                  </label>
                </div>
              </div>

              {/* Display Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Display Settings
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={beamData.stressAnalysis?.showStressDiagrams !== false}
                      onChange={(e) => updateStressAnalysisSettings({ showStressDiagrams: e.target.checked })}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Show Stress Diagrams (SSD & BSD)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={beamData.stressAnalysis?.showStressValues !== false}
                      onChange={(e) => updateStressAnalysisSettings({ showStressValues: e.target.checked })}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-gray-700 dark:text-gray-300">Show Stress Values on Diagrams</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Cross-Section Properties</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Section Type
            </label>
            <select
              value={section.type || sectionType}
              onChange={handleSectionTypeChange}
              className="input-field"
            >
              <option value="rectangular">Rectangular</option>
              <option value="circular">Circular</option>
              <option value="i-beam">I-Beam</option>
              <option value="t-beam">T-Beam</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Rectangular Section */}
          {(section.type || sectionType) === 'rectangular' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Width (b) ({getUnit('sectionLength')})
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={convertValue(section.width || 0.3, 'sectionLength', 'SI')}
                  onChange={(e) => updateSectionProperty('width', parseFloat(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Height (h) ({getUnit('sectionLength')})
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={convertValue(section.height || 0.5, 'sectionLength', 'SI')}
                  onChange={(e) => updateSectionProperty('height', parseFloat(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
            </div>
          )}

          {/* Circular Section */}
          {(section.type || sectionType) === 'circular' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Diameter ({getUnit('sectionLength')})
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={convertValue(section.diameter || 0.4, 'sectionLength', 'SI')}
                onChange={(e) => updateSectionProperty('diameter', parseFloat(e.target.value) || 0)}
                className="input-field"
              />
            </div>
          )}

          {/* I-Beam Section */}
          {(section.type || sectionType) === 'i-beam' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Flange Width ({getUnit('sectionLength')})
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={convertValue(section.flangeWidth || 0.2, 'sectionLength', 'SI')}
                  onChange={(e) => updateSectionProperty('flangeWidth', parseFloat(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Flange Thickness ({getUnit('sectionLength')})
                </label>
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={convertValue(section.flangeThickness || 0.02, 'sectionLength', 'SI')}
                  onChange={(e) => updateSectionProperty('flangeThickness', parseFloat(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Web Height ({getUnit('sectionLength')})
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={convertValue(section.webHeight || 0.4, 'sectionLength', 'SI')}
                  onChange={(e) => updateSectionProperty('webHeight', parseFloat(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Web Thickness ({getUnit('sectionLength')})
                </label>
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={convertValue(section.webThickness || 0.01, 'sectionLength', 'SI')}
                  onChange={(e) => updateSectionProperty('webThickness', parseFloat(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
            </div>
          )}

          {/* T-Beam Section */}
          {(section.type || sectionType) === 't-beam' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Flange Width ({getUnit('sectionLength')})
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={convertValue(section.flangeWidth || 0.3, 'sectionLength', 'SI')}
                  onChange={(e) => updateSectionProperty('flangeWidth', parseFloat(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Flange Thickness ({getUnit('sectionLength')})
                </label>
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={convertValue(section.flangeThickness || 0.05, 'sectionLength', 'SI')}
                  onChange={(e) => updateSectionProperty('flangeThickness', parseFloat(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Web Height ({getUnit('sectionLength')})
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={convertValue(section.webHeight || 0.4, 'sectionLength', 'SI')}
                  onChange={(e) => updateSectionProperty('webHeight', parseFloat(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Web Thickness ({getUnit('sectionLength')})
                </label>
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={convertValue(section.webThickness || 0.02, 'sectionLength', 'SI')}
                  onChange={(e) => updateSectionProperty('webThickness', parseFloat(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
            </div>
          )}

          {/* Custom Section */}
          {(section.type || sectionType) === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Moment of Inertia ({getUnit('inertia')})
              </label>
              <input
                type="number"
                min="1e-8"
                step="1e-8"
                value={convertValue(section.momentOfInertia || 1e-4, 'inertia', 'SI')}
                onChange={(e) => {
                  const siValue = convertValue(parseFloat(e.target.value) || 0, 'inertia', null, 'SI');
                  updateSectionProperty('momentOfInertia', siValue);
                }}
                className="input-field"
              />
            </div>
          )}
        </div>
      </div>

      {/* Section Visualization */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Section Preview with Neutral Axis</h4>
        <div className="flex justify-center">
          <svg width="200" height="150" viewBox="0 0 200 150" className="border border-gray-300 dark:border-gray-600 rounded">
            {(section.type || sectionType) === 'rectangular' && (
              <>
              <rect
                x="50"
                y="25"
                width="100"
                height="100"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-blue-600 dark:text-blue-400"
              />
                {/* Neutral axis at h/2 */}
                <line
                  x1="30"
                  y1="75"
                  x2="170"
                  y2="75"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  className="text-red-500"
                />
                <text x="175" y="80" fontSize="10" fill="currentColor" className="text-red-600 dark:text-red-400">
                  N.A. (h/2)
                </text>
                {/* Dimension labels */}
                <text x="100" y="20" fontSize="10" textAnchor="middle" fill="currentColor" className="text-gray-600 dark:text-gray-400">
                  b = {convertValue(section.width || 0.3, 'sectionLength', 'SI').toFixed(0)} {getUnit('sectionLength')}
                </text>
                <text x="25" y="80" fontSize="10" textAnchor="middle" fill="currentColor" className="text-gray-600 dark:text-gray-400" transform="rotate(-90, 25, 80)">
                  h = {convertValue(section.height || 0.5, 'sectionLength', 'SI').toFixed(0)} {getUnit('sectionLength')}
                </text>
              </>
            )}
            {(section.type || sectionType) === 'circular' && (
              <>
              <circle
                cx="100"
                cy="75"
                r="50"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-blue-600 dark:text-blue-400"
              />
                {/* Neutral axis */}
                <line
                  x1="30"
                  y1="75"
                  x2="170"
                  y2="75"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  className="text-red-500"
                />
                <text x="175" y="80" fontSize="10" fill="currentColor" className="text-red-600 dark:text-red-400">
                  N.A.
                </text>
              </>
            )}
            {(section.type || sectionType) === 'i-beam' && (
              <>
              <g className="text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2">
                {/* Top flange */}
                <rect x="40" y="25" width="120" height="20" />
                {/* Web */}
                <rect x="90" y="45" width="20" height="60" />
                {/* Bottom flange */}
                <rect x="40" y="105" width="120" height="20" />
              </g>
                {/* Neutral axis */}
                <line
                  x1="30"
                  y1="75"
                  x2="170"
                  y2="75"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  className="text-red-500"
                />
                <text x="175" y="80" fontSize="10" fill="currentColor" className="text-red-600 dark:text-red-400">
                  N.A.
                </text>
              </>
            )}
            {(section.type || sectionType) === 't-beam' && (
              <>
              <g className="text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2">
                {/* Top flange */}
                <rect x="40" y="25" width="120" height="25" />
                {/* Web */}
                <rect x="90" y="50" width="20" height="75" />
              </g>
                {/* Neutral axis */}
                <line
                  x1="30"
                  y1="75"
                  x2="170"
                  y2="75"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  className="text-red-500"
                />
                <text x="175" y="80" fontSize="10" fill="currentColor" className="text-red-600 dark:text-red-400">
                  N.A.
                </text>
              </>
            )}
            {(section.type || sectionType) === 'custom' && (
              <>
                <rect
                  x="50"
                  y="25"
                  width="100"
                  height="100"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  className="text-blue-600 dark:text-blue-400"
                />
                <text x="100" y="80" textAnchor="middle" className="text-xs fill-current">
                  Custom
                </text>
                {/* Neutral axis */}
                <line
                  x1="30"
                  y1="75"
                  x2="170"
                  y2="75"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  className="text-red-500"
                />
                <text x="175" y="80" fontSize="10" fill="currentColor" className="text-red-600 dark:text-red-400">
                  N.A.
                </text>
              </>
            )}
          </svg>
        </div>
      </div>

      {/* Section Properties Summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Section Properties for Stress Analysis
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1">
                              <div>Cross-sectional Area (A) = {sectionProperties.area.toFixed(4)} {getUnit('sectionArea')}</div>
                              <div>Moment of Inertia (I) = {sectionProperties.momentOfInertia.toExponential(3)} {getUnit('sectionInertia')}</div>
              <div>Neutral Axis Height = {sectionProperties.centroidHeight.toFixed(3)} {getUnit('sectionLength')}</div>
              <div>Distance to extreme fiber (c) = {sectionProperties.maxDistanceFromCentroid.toFixed(3)} {getUnit('sectionLength')}</div>
              <div>First Moment of Area (Q) = {sectionProperties.firstMomentOfArea.toExponential(3)} {getUnit('sectionFirstMoment')}</div>
              {currentSectionType === 'rectangular' && (
                <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                  For rectangular beam: I = b×h³/12, Neutral axis at h/2 = {convertValue((section.height || 0.5)/2, 'sectionLength', 'SI').toFixed(1)} {getUnit('sectionLength')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>



      {/* Section Presets */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Section Presets</h4>
        <div className="grid grid-cols-1 gap-2">
          {sectionPresets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="p-3 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="font-medium text-sm text-gray-900 dark:text-white">{preset.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{preset.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SectionTab;