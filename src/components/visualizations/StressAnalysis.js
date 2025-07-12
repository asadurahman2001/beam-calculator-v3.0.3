import React, { useState, useEffect } from 'react';
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
import { Line, Scatter } from 'react-chartjs-2';
import { useUnits } from '../../contexts/UnitContext';
} from 'chart.js';

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

const StressAnalysis = ({ beamData, results }) => {
  const { convertValue, getUnit, units } = useUnits();
  const { isDarkMode } = useTheme();
  const [chartKey, setChartKey] = useState(0);
  const [analysisPosition, setAnalysisPosition] = useState(beamData.length / 2);

  // Calculate rectangular beam properties for display
  const getRectangularBeamProperties = () => {
    const section = beamData.section || {};
    // Convert to feet in imperial mode, keep in current units for SI
    const b_inch = convertValue(section.width || 0.3, 'sectionLength', 'SI');
    const h_inch = convertValue(section.height || 0.5, 'sectionLength', 'SI');
    
    // Convert to feet for imperial mode
    const b = b_inch / 12; // Convert inches to feet
    const h = h_inch / 12; // Convert inches to feet
    
    const I = (b * Math.pow(h, 3)) / 12; // I in ft⁴
    const c = h / 2; // Distance to extreme fiber in ft
    const Q_max = b * h * h / 8; // Q_max in ft³
    
    console.log('Rectangular Beam Properties (in ft):', { b, h, I, c, Q_max });
    return { b, h, I, c, Q_max };
  };

  // Force chart re-render when theme changes
  useEffect(() => {
    setChartKey(prev => prev + 1);
  }, [isDarkMode]);

  const calculateSectionProperties = () => {
    const section = beamData.section || {};
    let properties = {
      area: 0,
      momentOfInertia: beamData.materialProperties.I,
      centroidHeight: 0,
      maxDistanceFromCentroid: 0,
      thickness: 0,
      firstMomentOfArea: 0
    };

    switch (section.type) {
      case 'rectangular':
        const b = section.width || 0.3;
        const h = section.height || 0.5;
        properties.area = b * h;
        properties.centroidHeight = h / 2;
        properties.maxDistanceFromCentroid = h / 2;
        properties.thickness = b;
        properties.firstMomentOfArea = (b * h * h) / 8;
        break;
      case 'circular':
        const d = section.diameter || 0.4;
        const r = d / 2;
        properties.area = Math.PI * r * r;
        properties.centroidHeight = r;
        properties.maxDistanceFromCentroid = r;
        properties.thickness = d; // Diameter at neutral axis
        properties.firstMomentOfArea = (2 * r * r * r) / 3;
        break;
      case 'i-beam':
        const bf = section.flangeWidth || 0.2;
        const tf = section.flangeThickness || 0.02;
        const hw = section.webHeight || 0.4;
        const tw = section.webThickness || 0.01;
        const totalHeight = hw + 2 * tf;
        properties.area = 2 * bf * tf + tw * hw;
        properties.centroidHeight = totalHeight / 2;
        properties.maxDistanceFromCentroid = totalHeight / 2;
        properties.thickness = tw; // Web thickness
        properties.firstMomentOfArea = bf * tf * (totalHeight / 2 - tf / 2);
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
        
        properties.area = A1 + A2;
        properties.centroidHeight = yBar;
        properties.maxDistanceFromCentroid = Math.max(yBar, totalHeightT - yBar);
        properties.thickness = twT;
        properties.firstMomentOfArea = A1 * Math.abs(y1 - yBar);
        break;
      default:
        properties.area = 0.15;
        properties.centroidHeight = 0.25;
        properties.maxDistanceFromCentroid = 0.25;
        properties.thickness = 0.3;
        properties.firstMomentOfArea = 0.01;
    }

    return properties;
  };

  const calculateStresses = () => {
    if (results.shearForce.x.length === 0) return { bendingStress: [], shearStress: [] };

    const section = beamData.section || {};
    
    // Use rectangular beam specific calculation if it's a rectangular section
    if (section.type === 'rectangular' || !section.type) {
      return calculateRectangularBeamStressesAlongLength(convertValue);
    }

    // General calculation for other sections
    const sectionProps = calculateSectionProperties();
    const bendingStress = [];
    const shearStress = [];

    for (let i = 0; i < results.shearForce.x.length; i++) {
      const moment = results.bendingMoment.y[i];
      const shearForce = results.shearForce.y[i];

      // Bending stress (maximum at extreme fiber)
      const maxBendingStress = Math.abs(moment * sectionProps.maxDistanceFromCentroid / sectionProps.momentOfInertia);
      
      // Shear stress (maximum at neutral axis for most sections)
      const maxShearStress = Math.abs(shearForce * sectionProps.firstMomentOfArea / (sectionProps.momentOfInertia * sectionProps.thickness));

      bendingStress.push(maxBendingStress);
      shearStress.push(maxShearStress);
    }

    return { bendingStress, shearStress };
  };

  // Calculate stresses along beam length specifically for rectangular beams
  const calculateRectangularBeamStressesAlongLength = (convertValue) => {
    const section = beamData.section || {};
    
    // Get dimensions in inches first
    const b_inch = convertValue(section.width || 0.3, 'sectionLength', 'SI'); // width in inches
    const h_inch = convertValue(section.height || 0.5, 'sectionLength', 'SI'); // height in inches
    
    // Convert to feet for calculations
    const b = b_inch / 12; // width in feet
    const h = h_inch / 12; // height in feet
    
    // Section properties for rectangular beam (in feet)
    const I = (b * Math.pow(h, 3)) / 12; // Moment of inertia in ft⁴
    const c = h / 2; // Distance to extreme fiber in ft
    const Q_max = b * h * h / 8; // Maximum first moment of area in ft³
    
    console.log('Rectangular Beam Properties (in ft):', { b, h, I, c, Q_max });
    const bendingStress = [];
    const shearStress = [];

    for (let i = 0; i < results.shearForce.x.length; i++) {
      const moment = results.bendingMoment.y[i];
      const shearForce = results.shearForce.y[i];

      // Bending stress: σ = M*c/I (maximum at extreme fiber)
      const maxBendingStress = Math.abs(moment * c / I);
      
      // Shear stress: τ = V*Q/(I*b) (maximum at neutral axis)
      const maxShearStress = Math.abs(shearForce * Q_max / (I * b));

      bendingStress.push(maxBendingStress);
      shearStress.push(maxShearStress);
    }

    return { bendingStress, shearStress };
  };

  const calculateStressAtPosition = (position) => {
    if (results.shearForce.x.length === 0) return { bendingStress: 0, shearStress: 0, moment: 0, shearForce: 0 };

    // Find the closest index to the analysis position
    const index = results.shearForce.x.findIndex(x => x >= position);
    const actualIndex = index === -1 ? results.shearForce.x.length - 1 : index;

    const moment = results.bendingMoment.y[actualIndex];
    const shearForce = results.shearForce.y[actualIndex];

    const section = beamData.section || {};
    
    // Use rectangular beam specific calculation if it's a rectangular section
    if (section.type === 'rectangular' || !section.type) {
      // Get dimensions in inches first
      const b_inch = convertValue(section.width || 0.3, 'sectionLength', 'SI'); // width in inches
      const h_inch = convertValue(section.height || 0.5, 'sectionLength', 'SI'); // height in inches
      
      // Convert to feet for calculations
      const b = b_inch / 12; // width in feet
      const h = h_inch / 12; // height in feet
      
      // Section properties for rectangular beam (in feet)
      const I = (b * Math.pow(h, 3)) / 12; // Moment of inertia in ft⁴
      const c = h / 2; // Distance to extreme fiber in ft
      const Q_max = b * h * h / 8; // Maximum first moment of area in ft³
      
      const maxBendingStress = Math.abs(moment * c / I);
      const maxShearStress = Math.abs(shearForce * Q_max / (I * b));

      return {
        bendingStress: maxBendingStress,
        shearStress: maxShearStress,
        moment: Math.abs(moment),
        shearForce: Math.abs(shearForce)
      };
    }

    // General calculation for other sections
    const sectionProps = calculateSectionProperties();
    const maxBendingStress = Math.abs(moment * sectionProps.maxDistanceFromCentroid / sectionProps.momentOfInertia);
    const maxShearStress = Math.abs(shearForce * sectionProps.firstMomentOfArea / (sectionProps.momentOfInertia * sectionProps.thickness));

    return {
      bendingStress: maxBendingStress,
      shearStress: maxShearStress,
      moment: Math.abs(moment),
      shearForce: Math.abs(shearForce)
    };
  };

  // Specific function for rectangular beam stress calculations
  const calculateRectangularBeamStresses = (position, convertValue) => {
    const stressAtPos = calculateStressAtPosition(position);
    const section = beamData.section || {};
    // Get dimensions in inches first
    const b_inch = convertValue(section.width || 0.3, 'sectionLength', 'SI'); // width in inches
    const h_inch = convertValue(section.height || 0.5, 'sectionLength', 'SI'); // height in inches
    
    // Convert to feet for calculations
    const b = b_inch / 12; // width in feet
    const h = h_inch / 12; // height in feet
    
    // Convert moment and shear force to imperial units for calculations
    const moment_imperial = convertValue(stressAtPos.moment, 'moment', 'SI', 'FPS'); // Convert to kip-ft
    const shearForce_imperial = convertValue(stressAtPos.shearForce, 'force', 'SI', 'FPS'); // Convert to kip
    
    // Section properties for rectangular beam (in feet)
    const I = (b * Math.pow(h, 3)) / 12; // Moment of inertia in ft⁴
    const c = h / 2; // Distance to extreme fiber in ft
    // Maximum stresses
    const maxBendingStress = Math.abs(moment_imperial * c / I);
    const maxShearStress = Math.abs(shearForce_imperial * (b * h * h / 8) / (I * b)); // Q = b*h²/8 at neutral axis
    // Stress distribution across height
    const points = 50;
    const distribution = [];
    for (let i = 0; i <= points; i++) {
      const y = (i / points) * h - h/2; // y from neutral axis (-h/2 to h/2)
      // Bending stress: σ = M*y/I (linear variation)
      const bendingStress = moment_imperial * y / I;
      // Shear stress: τ = V*Q/(I*b) where Q = b*(h²/4 - y²)/2 for rectangular section
      const Q = b * (h * h / 4 - y * y) / 2;
      const shearStress = Math.abs(shearForce_imperial * Q / (I * b));
      distribution.push({
        y: y,
        bendingStress: bendingStress,
        shearStress: shearStress,
        position: (y + h/2) * 12 // Position from bottom of beam (convert feet to inches)
      });
    }
    return {
      maxBendingStress,
      maxShearStress,
      distribution,
      sectionProps: { b, h, I, c }
    };
  };

  const generateCrossSectionStressDistribution = (position) => {
    const stressAtPos = calculateStressAtPosition(position);
    const sectionProps = calculateSectionProperties();
    const points = 50;
    const distribution = [];
    const section = beamData.section || {};

    // Use rectangular beam specific calculation if it's a rectangular section
    if (section.type === 'rectangular' || !section.type) {
      const rectangularStresses = calculateRectangularBeamStresses(position, convertValue);
      return rectangularStresses.distribution;
    }

    // Generate stress distribution across the height of the section for other sections
    for (let i = 0; i <= points; i++) {
      const y = (i / points) * (2 * sectionProps.maxDistanceFromCentroid) - sectionProps.maxDistanceFromCentroid;
      
      // Bending stress varies linearly from neutral axis: σ = M*y/I
      const bendingStress = stressAtPos.moment * y / sectionProps.momentOfInertia;
      
      // Shear stress calculation: τ = V*Q/(I*b)
      let shearStress = 0;
      if (section.type === 'circular') {
        const d = section.diameter || 0.4;
        const r = d / 2;
        const I = sectionProps.momentOfInertia;
        const V = stressAtPos.shearForce;
        
        // For circular section: Q = (2/3) * r³ * (1 - (y/r)²)^(3/2)
        if (Math.abs(y) < r) {
          const Q = (2/3) * Math.pow(r, 3) * Math.pow(1 - Math.pow(y/r, 2), 1.5);
          shearStress = Math.abs(V * Q / (I * d));
        }
      } else {
        // Simplified for other sections - maximum at neutral axis
        shearStress = stressAtPos.shearForce * (1 - Math.abs(y) / sectionProps.maxDistanceFromCentroid) / sectionProps.area;
      }

      distribution.push({
        y: y,
        bendingStress: bendingStress,
        shearStress: Math.max(0, shearStress)
      });
    }

    return distribution;
  };

  const { bendingStress, shearStress } = calculateStresses();
  const displayXCoords = results.shearForce.x.map(x => convertValue(x, 'length', 'SI'));
  const displayBendingStress = bendingStress.map(stress => convertValue(stress, 'stress', 'SI'));
  const displayShearStress = shearStress.map(stress => convertValue(stress, 'stress', 'SI'));

  const stressAtAnalysisPoint = calculateStressAtPosition(analysisPosition);
  const crossSectionDistribution = generateCrossSectionStressDistribution(analysisPosition);

  // Calculate rectangular beam properties for display
  const rectangularProps = getRectangularBeamProperties();
  let rectangularStressResults = null;
  
  // Comprehensive console logging for rectangular beams
  if (beamData.section?.type === 'rectangular' || !beamData.section?.type) {
    rectangularStressResults = calculateRectangularBeamStresses(analysisPosition, convertValue);
    
    console.log('='.repeat(80));
    console.log('🔧 RECTANGULAR BEAM STRESS ANALYSIS');
    console.log('='.repeat(80));
    
    // 1. Beam Properties
    console.log('📐 BEAM PROPERTIES:');
    console.log(`   Width (b): ${rectangularProps.b.toFixed(6)} ft`);
    console.log(`   Height (h): ${rectangularProps.h.toFixed(6)} ft`);
    console.log(`   Moment of Inertia (I): ${rectangularProps.I.toFixed(8)} ft⁴`);
    console.log(`   Distance to extreme fiber (c): ${rectangularProps.c.toFixed(6)} ft`);
    console.log(`   Max First Moment of Area (Q_max): ${rectangularProps.Q_max.toFixed(8)} ft³`);
    console.log('');
    
    // 2. Stresses along beam length
    console.log('📊 STRESSES ALONG BEAM LENGTH:');
    console.log(`   Analysis Position: ${convertValue(analysisPosition, 'length', 'SI').toFixed(3)} ${units.length}`);
    console.log(`   Max Bending Stress: ${convertValue(rectangularStressResults.maxBendingStress, 'stress', 'SI').toFixed(2)} ${units.stress}`);
    console.log(`   Max Shear Stress: ${convertValue(rectangularStressResults.maxShearStress, 'stress', 'SI').toFixed(2)} ${units.stress}`);
    
    // Show stress variation along beam length
    console.log('   Stress variation along beam length:');
    console.log('   Position | Bending Moment | Shear Force | Bending Stress | Shear Stress');
    console.log('   ' + '-'.repeat(75));
    
    const stepLength = Math.max(1, Math.floor(bendingStress.length / 8)); // Show ~8 points along beam
    for (let i = 0; i < bendingStress.length; i += stepLength) {
      const position = convertValue(results.shearForce.x[i], 'length', 'SI');
      const moment = convertValue(results.bendingMoment.y[i], 'moment', 'SI');
      const shearForce = convertValue(results.shearForce.y[i], 'force', 'SI');
      const bendingStressDisplay = convertValue(bendingStress[i], 'stress', 'SI');
      const shearStressDisplay = convertValue(shearStress[i], 'stress', 'SI');
      
      console.log(`   ${position.toFixed(2).padStart(6)} ${getUnit('length')} | ${moment.toFixed(2).padStart(12)} ${getUnit('moment')} | ${shearForce.toFixed(2).padStart(10)} ${getUnit('force')} | ${bendingStressDisplay.toFixed(2).padStart(12)} ${getUnit('stress')} | ${shearStressDisplay.toFixed(2).padStart(10)} ${getUnit('stress')}`);
    }
    
    // Show last point if not already shown
    if (bendingStress.length > 0 && (bendingStress.length - 1) % stepLength !== 0) {
      const lastIndex = bendingStress.length - 1;
      const position = convertValue(results.shearForce.x[lastIndex], 'length', 'SI');
      const moment = convertValue(results.bendingMoment.y[lastIndex], 'moment', 'SI');
      const shearForce = convertValue(results.shearForce.y[lastIndex], 'force', 'SI');
      const bendingStressDisplay = convertValue(bendingStress[lastIndex], 'stress', 'SI');
      const shearStressDisplay = convertValue(shearStress[lastIndex], 'stress', 'SI');
      
      console.log(`   ${position.toFixed(2).padStart(6)} ${getUnit('length')} | ${moment.toFixed(2).padStart(12)} ${getUnit('moment')} | ${shearForce.toFixed(2).padStart(10)} ${getUnit('force')} | ${bendingStressDisplay.toFixed(2).padStart(12)} ${getUnit('stress')} | ${shearStressDisplay.toFixed(2).padStart(10)} ${getUnit('stress')}`);
    }
    console.log('');
    

    
    // 4. Stress distribution across section height (at analysis position)
    console.log('📈 STRESS DISTRIBUTION ACROSS SECTION HEIGHT (AT ANALYSIS POSITION):');
    
    // Get V and M at analysis position
    const momentAtPosition = convertValue(stressAtAnalysisPoint.moment, 'moment', 'SI');
    const shearForceAtPosition = convertValue(stressAtAnalysisPoint.shearForce, 'force', 'SI');
    const I = rectangularStressResults.sectionProps.I; // Moment of inertia in ft⁴
    const c = rectangularStressResults.sectionProps.c; // Distance to extreme fiber in ft
    console.log(`   V = ${shearForceAtPosition.toFixed(2)} ${getUnit('force')} | M = ${momentAtPosition.toFixed(2)} ${getUnit('moment')} | I = ${I.toFixed(8)} ft⁴ | c = ${c.toFixed(6)} ft`);
    console.log('');
    
    console.log('   Position from bottom | Bending Stress | Shear Stress | Q (First Moment) | c (from NA) | y (from NA)');
    console.log('   ' + '-'.repeat(115));
    
    const distribution = rectangularStressResults.distribution;
    const step = Math.max(1, Math.floor(distribution.length / 10)); // Show ~10 points
    
    for (let i = 0; i < distribution.length; i += step) {
      const point = distribution[i];
      const positionFromBottom = point.position; // Already in inches, no need to convert
      const bendingStressDisplay = Math.abs(point.bendingStress); // Already in kip/ft², no conversion needed
      const shearStressDisplay = point.shearStress; // Already in kip/ft², no conversion needed
      
      // Calculate Q for this position
      const y = point.y; // y from neutral axis in feet
      const b = rectangularStressResults.sectionProps.b; // width in feet
      const h = rectangularStressResults.sectionProps.h; // height in feet
      const Q = b * (h * h / 4 - y * y) / 2; // First moment of area in ft³
      const QDisplay = convertValue(Q, 'firstMoment', 'SI');
      
      console.log(`   ${positionFromBottom.toFixed(3).padStart(8)} ${getUnit('sectionLength')} | ${bendingStressDisplay.toFixed(2).padStart(12)} kip/ft² | ${shearStressDisplay.toFixed(2).padStart(10)} kip/ft² | ${QDisplay.toFixed(6).padStart(12)} ${getUnit('firstMoment')} | ${Math.abs(y).toFixed(6).padStart(10)} ft | ${y.toFixed(6).padStart(10)} ft`);
    }
    
    // Show last point if not already shown
    if (distribution.length > 0 && (distribution.length - 1) % step !== 0) {
      const lastPoint = distribution[distribution.length - 1];
      const positionFromBottom = lastPoint.position; // Already in inches, no need to convert
      const bendingStressDisplay = Math.abs(lastPoint.bendingStress); // Already in kip/ft², no conversion needed
      const shearStressDisplay = lastPoint.shearStress; // Already in kip/ft², no conversion needed
      
      // Calculate Q for last position
      const y = lastPoint.y; // y from neutral axis in feet
      const b = rectangularStressResults.sectionProps.b; // width in feet
      const h = rectangularStressResults.sectionProps.h; // height in feet
      const Q = b * (h * h / 4 - y * y) / 2; // First moment of area in ft³
      const QDisplay = convertValue(Q, 'firstMoment', 'SI');
      
      console.log(`   ${positionFromBottom.toFixed(3).padStart(8)} ${getUnit('sectionLength')} | ${bendingStressDisplay.toFixed(2).padStart(12)} kip/ft² | ${shearStressDisplay.toFixed(2).padStart(10)} kip/ft² | ${QDisplay.toFixed(6).padStart(12)} ${getUnit('firstMoment')} | ${Math.abs(y).toFixed(6).padStart(10)} ft | ${y.toFixed(6).padStart(10)} ft`);
    }
    
    console.log('');
    console.log('📋 SUMMARY:');
    console.log(`   • Bending stress varies linearly from ${convertValue(-rectangularStressResults.maxBendingStress, 'stress', 'SI').toFixed(2)} to ${convertValue(rectangularStressResults.maxBendingStress, 'stress', 'SI').toFixed(2)} ${getUnit('stress')}`);
    console.log(`   • Shear stress is maximum at neutral axis: ${convertValue(rectangularStressResults.maxShearStress, 'stress', 'SI').toFixed(2)} ${getUnit('stress')}`);
    console.log(`   • Shear stress is zero at extreme fibers`);
    console.log('='.repeat(80));
  }

  // Chart options
  const getChartOptions = (yAxisLabel) => ({
    responsive: true,
    maintainAspectRatio: false,
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
            return `Position: ${xValue.toFixed(2)} ${getUnit('length')}`;
          },
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(3)}`;
          }
        }
      },
      annotation: {
        annotations: {
          zeroLine: {
            type: 'line',
            xMin: 0,
            xMax: 0,
            borderColor: 'red',
            borderWidth: 2,
            label: {
              content: 'Neutral Axis',
              enabled: true,
              position: 'start',
              color: 'red',
              font: { weight: 'bold' }
            }
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        reverse: true,
        title: {
          display: true,
          text: `Bending Stress (${getUnit('stress')})`,
          color: isDarkMode ? '#e5e7eb' : '#374151'
        },
        grid: {
          display: true,
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: isDarkMode ? '#d1d5db' : '#6b7280',
          callback: function(value) {
            return Number(value).toFixed(2);
          }
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: yAxisLabel,
          color: isDarkMode ? '#e5e7eb' : '#374151'
        },
        grid: {
          display: true,
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: isDarkMode ? '#d1d5db' : '#6b7280',
          callback: function(value) {
            return Number(value).toFixed(2);
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  });

  const bendingStressData = {
    labels: displayXCoords.map(x => x.toFixed(2)),
    datasets: [
      {
        label: `Bending Stress (${getUnit('stress')})`,
        data: displayBendingStress,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 4,
      }
    ]
  };

  const shearStressData = {
    labels: displayXCoords.map(x => x.toFixed(2)),
    datasets: [
      {
        label: `Shear Stress (${getUnit('stress')})`,
        data: displayShearStress,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 4,
      }
    ]
  };

  // Split the cross-section distribution into compression and tension regions
  const compressionData = crossSectionDistribution
    .filter(point => point.bendingStress <= 0)
    .map(point => ({ x: point.bendingStress, y: point.position }));

  const tensionData = crossSectionDistribution
    .filter(point => point.bendingStress >= 0)
    .map(point => ({ x: point.bendingStress, y: point.position }));

  const crossSectionBendingData = {
    datasets: [
      {
        label: 'Compression',
        data: compressionData,
        borderColor: '#f87171', // red
        backgroundColor: 'rgba(248, 113, 113, 0.3)', // light red
        fill: 'origin',
        showLine: true,
        pointRadius: 0,
        tension: 0.1,
      },
      {
        label: 'Tension',
        data: tensionData,
        borderColor: '#60a5fa', // blue
        backgroundColor: 'rgba(96, 165, 250, 0.3)', // light blue
        fill: 'end', // fill to the rightmost edge (upper portion)
        showLine: true,
        pointRadius: 0,
        tension: 0.1,
      }
    ]
  };

  // Split the cross-section distribution into negative and positive shear stress regions
  const negativeShearData = crossSectionDistribution
    .filter(point => point.shearStress < 0)
    .map(point => ({ x: point.shearStress, y: point.position }));

  const positiveShearData = crossSectionDistribution
    .filter(point => point.shearStress >= 0)
    .map(point => ({ x: point.shearStress, y: point.position }));

  const crossSectionShearData = {
    datasets: [
      {
        label: 'Shear Stress Distribution',
        data: crossSectionDistribution.map(point => ({
          x: point.shearStress,
          y: point.position
        })),
        borderColor: '#34d399', // green
        backgroundColor: 'rgba(52, 211, 153, 0.3)', // light green
        fill: 'origin', // fill to x=0 (the y-axis)
        showLine: true,
        pointRadius: 0,
        tension: 0.1,
      }
    ]
  };

  const displayAnalysisPosition = convertValue(analysisPosition, 'length', 'SI');

  return (
    <div className="space-y-6">
      {/* Cross-Section and Stress Distribution Layout - Moved to Top */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bending Stress Distribution across Cross-Section */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Bending Stress Distribution
          </h3>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex flex-col items-center">
          </div>
          <div className="h-96">
            <Line 
              key={`cross-bending-${chartKey}`}
              data={crossSectionBendingData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
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
                        const xValue = context[0].parsed.x;
                        return `Bending Stress: ${xValue.toFixed(2)} kip/ft²`;
                      },
                      label: function(context) {
                        const yValue = context.parsed.y;
                        return `Position: ${yValue.toFixed(3)} in`;
                      }
                    }
                  },
                  annotation: {
                    annotations: {
                      zeroLine: {
                        type: 'line',
                        xMin: 0,
                        xMax: 0,
                        borderColor: 'red',
                        borderWidth: 2,
                        label: {
                          content: 'Neutral Axis',
                          enabled: true,
                          position: 'start',
                          color: 'red',
                          font: { weight: 'bold' }
                        }
                      }
                    }
                  }
                },
                scales: {
                  x: {
                    type: 'linear',
                    title: {
                      display: true,
                      text: `Bending Stress (kip/ft²)`,
                      color: isDarkMode ? '#e5e7eb' : '#374151'
                    },
                    min: -Math.abs(rectangularStressResults.maxBendingStress), // show negative and positive
                    max: Math.abs(rectangularStressResults.maxBendingStress),
                    grid: {
                      display: true,
                      color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                      color: isDarkMode ? '#d1d5db' : '#6b7280',
                      callback: function(value) {
                        return Number(value).toFixed(2);
                      }
                    }
                  },
                  y: {
                    title: {
                      display: true,
                      text: `Position from Bottom (in)`,
                      color: isDarkMode ? '#e5e7eb' : '#374151'
                    },
                    min: 0,
                    max: rectangularProps.h * 12, // full height in inches
                    grid: {
                      display: true,
                      color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                      color: isDarkMode ? '#d1d5db' : '#6b7280',
                      callback: function(value) {
                        return Number(value).toFixed(3);
                      }
                    }
                  }
                },
                interaction: {
                  mode: 'nearest',
                  axis: 'x',
                  intersect: false
                }
              }} 
            />
          </div>
        </div>

        {/* Cross-Section Visualization */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Cross-Section at {displayAnalysisPosition.toFixed(2)} {getUnit('length')}
          </h3>
          <div className="flex flex-col items-center justify-center h-96">
            {/* Section Preview */}
            <div className="mb-6">
              <svg width="200" height="200" viewBox="0 0 200 200" className="border border-gray-300 dark:border-gray-600 rounded">
                {(beamData.section?.type || 'rectangular') === 'rectangular' && (
                  <>
                    <rect
                      x="50"
                      y="50"
                      width="100"
                      height="100"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-blue-600 dark:text-blue-400"
                    />
                    {/* Neutral axis */}
                    <line
                      x1="30"
                      y1="100"
                      x2="170"
                      y2="100"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeDasharray="5,5"
                      className="text-yellow-500"
                    />
                    <text x="175" y="105" fontSize="10" fill="currentColor" className="text-yellow-600 dark:text-yellow-400">
                      N.A.
                    </text>
                    {/* Stress arrows for bending */}
                    <g className="text-purple-600 dark:text-purple-400">
                      {/* Compression arrows (top) */}
                      <polygon points="45,60 40,55 40,65" fill="currentColor" />
                      <polygon points="155,60 160,55 160,65" fill="currentColor" />
                      <line x1="40" y1="60" x2="160" y2="60" stroke="currentColor" strokeWidth="1" />
                      <text x="100" y="45" fontSize="8" textAnchor="middle" fill="currentColor">Compression</text>
                      
                      {/* Tension arrows (bottom) */}
                      <polygon points="40,140 45,135 45,145" fill="currentColor" />
                      <polygon points="160,140 155,135 155,145" fill="currentColor" />
                      <line x1="40" y1="140" x2="160" y2="140" stroke="currentColor" strokeWidth="1" />
                      <text x="100" y="165" fontSize="8" textAnchor="middle" fill="currentColor">Tension</text>
                    </g>
                  </>
                )}
                {(beamData.section?.type) === 'circular' && (
                  <>
                    <circle
                      cx="100"
                      cy="100"
                      r="50"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-blue-600 dark:text-blue-400"
                    />
                    {/* Neutral axis */}
                    <line
                      x1="30"
                      y1="100"
                      x2="170"
                      y2="100"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeDasharray="5,5"
                      className="text-yellow-500"
                    />
                  </>
                )}
                {(beamData.section?.type) === 'i-beam' && (
                  <>
                    <g className="text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2">
                      {/* Top flange */}
                      <rect x="40" y="50" width="120" height="20" />
                      {/* Web */}
                      <rect x="90" y="70" width="20" height="60" />
                      {/* Bottom flange */}
                      <rect x="40" y="130" width="120" height="20" />
                    </g>
                    {/* Neutral axis */}
                    <line
                      x1="30"
                      y1="100"
                      x2="170"
                      y2="100"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeDasharray="5,5"
                      className="text-yellow-500"
                    />
                  </>
                )}
              </svg>
            </div>
            
            {/* Stress values at this position */}
            <div className="text-center space-y-2">
              <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Max Bending Stress: {convertValue(stressAtAnalysisPoint.bendingStress, 'stress', 'SI').toFixed(2)} {getUnit('stress')}
              </div>
              <div className="text-sm font-medium text-amber-700 dark:text-amber-300">
                Max Shear Stress: {convertValue(stressAtAnalysisPoint.shearStress, 'stress', 'SI').toFixed(2)} {getUnit('stress')}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                M = {convertValue(stressAtAnalysisPoint.moment, 'moment', 'SI').toFixed(2)} {getUnit('moment')}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                V = {convertValue(stressAtAnalysisPoint.shearForce, 'force', 'SI').toFixed(2)} {getUnit('force')}
              </div>
            </div>
          </div>
        </div>

        {/* Shear Stress Distribution across Cross-Section */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Shear Stress Distribution
          </h3>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex flex-col items-center">
          </div>
          <div className="h-96">
            <Scatter 
              key={`cross-shear-${chartKey}`}
              data={crossSectionShearData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
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
                        const xValue = context[0].parsed.x;
                        return `Shear Stress: ${xValue.toFixed(2)} kip/ft²`;
                      },
                      label: function(context) {
                        const yValue = context.parsed.y;
                        return `Position: ${yValue.toFixed(3)} in`;
                      }
                    }
                  }
                },
                scales: {
                  x: {
                    display: true,
                    title: {
                      display: true,
                      text: `Shear Stress (kip/ft²)`,
                      color: isDarkMode ? '#e5e7eb' : '#374151'
                    },
                    grid: {
                      display: true,
                      color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                      color: isDarkMode ? '#d1d5db' : '#6b7280',
                      callback: function(value) {
                        return Number(value).toFixed(2);
                      }
                    }
                  },
                  y: {
                    title: {
                      display: true,
                      text: `Position from Bottom (in)`,
                      color: isDarkMode ? '#e5e7eb' : '#374151'
                    },
                    grid: {
                      display: true,
                      color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                      color: isDarkMode ? '#d1d5db' : '#6b7280',
                      callback: function(value) {
                        return Number(value).toFixed(3);
                      }
                    }
                  }
                },
                interaction: {
                  mode: 'nearest',
                  axis: 'x',
                  intersect: false
                }
              }} 
            />
          </div>
        </div>
      </div>

      {/* Analysis Position Control */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Stress Analysis Position</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Analysis Position: {displayAnalysisPosition.toFixed(2)} {getUnit('length')}
            </label>
            <input
              type="range"
              min="0"
              max={convertValue(beamData.length, 'length', 'SI')}
              step="0.1"
              value={displayAnalysisPosition}
              onChange={(e) => setAnalysisPosition(convertValue(parseFloat(e.target.value), 'length', null, 'SI'))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>0</span>
              <span>{convertValue(beamData.length, 'length', 'SI').toFixed(1)} {getUnit('length')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stress Values at Analysis Point */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
          <h4 className="font-semibold text-purple-900 dark:text-purple-200 mb-2">Maximum Bending Stress</h4>
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
            {convertValue(stressAtAnalysisPoint.bendingStress, 'stress', 'SI').toFixed(2)} {getUnit('stress')}
          </div>
          <div className="text-sm text-purple-600 dark:text-purple-400">
            at position {displayAnalysisPosition.toFixed(2)} {getUnit('length')}
          </div>
          <div className="text-xs text-purple-500 dark:text-purple-400 mt-1">
            Moment: {convertValue(stressAtAnalysisPoint.moment, 'moment', 'SI').toFixed(2)} {getUnit('moment')}
          </div>
        </div>
        <div className="card bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">Maximum Shear Stress</h4>
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
            {convertValue(stressAtAnalysisPoint.shearStress, 'stress', 'SI').toFixed(2)} {getUnit('stress')}
          </div>
          <div className="text-sm text-amber-600 dark:text-amber-400">
            at position {displayAnalysisPosition.toFixed(2)} {getUnit('length')}
          </div>
          <div className="text-xs text-amber-500 dark:text-amber-400 mt-1">
            Shear Force: {convertValue(stressAtAnalysisPoint.shearForce, 'force', 'SI').toFixed(2)} {getUnit('force')}
          </div>
        </div>
      </div>

      {/* Bending Stress Diagram (BSD) - Fixed Axis */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bending Stress Diagram (BSD)</h3>
        <div className="h-80">
          {results.shearForce.x.length > 0 ? (
            <Line 
              key={`bsd-${chartKey}`}
              data={bendingStressData} 
              options={getChartOptions(`Bending Stress (${getUnit('stress')})`)} 
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p>No data to display</p>
                <p className="text-sm">Configure beam parameters to see the bending stress diagram</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Shear Stress Diagram (SSD) - Fixed Axis */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Shear Stress Diagram (SSD)</h3>
        <div className="h-80">
          {results.shearForce.x.length > 0 ? (
            <Line 
              key={`ssd-${chartKey}`}
              data={shearStressData} 
              options={getChartOptions(`Shear Stress (${getUnit('stress')})`)} 
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <p>No data to display</p>
                <p className="text-sm">Configure beam parameters to see the shear stress diagram</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rectangular Beam Specific Stress Calculations */}
      {(beamData.section?.type === 'rectangular' || !beamData.section?.type) && (
        <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-4">
            Rectangular Beam Stress Calculations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-3">Section Properties</h4>
              {(() => {
                const { b, h, I, c, Q_max } = getRectangularBeamProperties();
                
                return (
                  <div className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                    <div>Width (b) = {b.toFixed(3)} {getUnit('sectionLength')}</div>
                    <div>Height (h) = {h.toFixed(3)} {getUnit('sectionLength')}</div>
                    <div>Moment of Inertia (I) = {I.toExponential(3)} {getUnit('sectionInertia')}</div>
                    <div>Distance to extreme fiber (c) = {c.toFixed(3)} {getUnit('sectionLength')}</div>
                    <div>Max First Moment (Q_max) = {Q_max.toExponential(3)} {getUnit('sectionFirstMoment')}</div>
                  </div>
                );
              })()}
            </div>
            <div>
              <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-3">Stress Formulas</h4>
              <div className="text-sm text-blue-700 dark:text-blue-400 space-y-2">
                <div>
                  <strong>Bending Stress:</strong><br/>
                  σ = M × c / I<br/>
                  <span className="text-xs">Maximum at extreme fibers (y = ±h/2)</span>
                </div>
                <div>
                  <strong>Shear Stress:</strong><br/>
                  τ = V × Q / (I × b)<br/>
                  <span className="text-xs">Maximum at neutral axis (y = 0)</span>
                </div>
                <div>
                  <strong>First Moment of Area:</strong><br/>
                  Q = b × (h²/4 - y²) / 2<br/>
                  <span className="text-xs">For any point at distance y from neutral axis</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Current Stress Values */}
          <div className="mt-4 pt-4 border-t border-blue-300 dark:border-blue-700">
            <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Current Stress Values</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-blue-800/50 rounded p-3">
                <div className="text-sm text-blue-600 dark:text-blue-400">Bending Stress at {displayAnalysisPosition.toFixed(2)} {getUnit('length')}</div>
                <div className="text-lg font-bold text-blue-800 dark:text-blue-200">
                  {convertValue(stressAtAnalysisPoint.bendingStress, 'stress', 'SI').toFixed(2)} {getUnit('stress')}
                </div>
              </div>
              <div className="bg-white dark:bg-blue-800/50 rounded p-3">
                <div className="text-sm text-blue-600 dark:text-blue-400">Shear Stress at {displayAnalysisPosition.toFixed(2)} {getUnit('length')}</div>
                <div className="text-lg font-bold text-blue-800 dark:text-blue-200">
                  {convertValue(stressAtAnalysisPoint.shearStress, 'stress', 'SI').toFixed(2)} {getUnit('stress')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stress Analysis Information */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Stress Analysis Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Bending Stress Analysis</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Maximum bending stress occurs at extreme fibers</li>
              <li>• Stress varies linearly across the section height</li>
              <li>• Zero stress at the neutral axis</li>
              <li>• Formula: σ = M × y / I (where y is distance from neutral axis)</li>
              <li>• For rectangular beam: I = b × h³ / 12</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Shear Stress Analysis</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Maximum shear stress typically at neutral axis</li>
              <li>• Stress varies parabolically for rectangular sections</li>
              <li>• Zero stress at extreme fibers</li>
              <li>• Formula: τ = V × Q / (I × b)</li>
              <li>• Q = first moment of area above the point</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StressAnalysis;