import React, { useRef, useEffect, useCallback } from 'react';
import { useUnits } from '../../contexts/UnitContext';
import { useTheme } from '../../contexts/ThemeContext';

const BeamDiagram = ({ beamData, results }) => {
  const canvasRef = useRef(null);
  const { convertValue, getUnit } = useUnits();
  const { isDarkMode } = useTheme();

  const drawSupport = useCallback((ctx, x, y, type, position, beamLength) => {
    ctx.save();
    // Use theme-aware colors
    const strokeColor = isDarkMode ? '#e5e7eb' : '#374151';
    const fillColor = isDarkMode ? '#e5e7eb' : '#374151';
    
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = fillColor;
    ctx.lineWidth = 2;

    switch (type) {
      case 'Fixed':
        // Determine orientation based on position
        const isAtStart = position === 0;
        const isAtEnd = position === beamLength;
        
        if (isAtStart) {
          // Fixed support at left end - hatching on the left
          ctx.fillRect(x - 20, y - 25, 20, 30);
          // Draw hatching on the left side
          for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.moveTo(x - 23, y - 25 + i * 5);
            ctx.lineTo(x - 18, y - 20 + i * 5);
            ctx.stroke();
          }
        } else if (isAtEnd) {
          // Fixed support at right end - hatching on the right
          ctx.fillRect(x, y - 25, 20, 30);
          // Draw hatching on the right side
          for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.moveTo(x + 23, y - 25 + i * 5);
            ctx.lineTo(x + 18, y - 20 + i * 5);
            ctx.stroke();
          }
        } else {
          // Fixed support in middle - default vertical
          ctx.fillRect(x - 15, y, 30, 20);
          // Draw hatching at bottom
          for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.moveTo(x - 15 + i * 5, y + 20);
            ctx.lineTo(x - 10 + i * 5, y + 25);
            ctx.stroke();
          }
        }
        break;
      case 'Hinge':
        // Draw hinge support
        ctx.beginPath();
        ctx.arc(x, y + 5, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x - 15, y + 20);
        ctx.lineTo(x, y);
        ctx.lineTo(x + 15, y + 20);
        ctx.lineTo(x - 15, y + 20);
        ctx.stroke();
         // Draw hatching at bottom
        for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.moveTo(x - 15 + i * 5, y + 20);
            ctx.lineTo(x - 10 + i * 5, y + 25);
            ctx.stroke();
          }
        break;
      case 'Roller':
        // Draw roller support
        ctx.beginPath();
        ctx.arc(x - 8, y + 20, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 8, y + 20, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x - 15, y + 20);
        ctx.lineTo(x, y);
        ctx.lineTo(x + 15, y + 20);
        ctx.lineTo(x - 15, y + 20);
        ctx.stroke();
        break;
      case 'Internal Hinge':
        // Draw internal hinge - small circle on the beam
        ctx.save();
        ctx.strokeStyle = '#dc2626'; // Red color for internal hinge
        ctx.fillStyle = '#ffffff';   // White fill
        ctx.lineWidth = 3;
        
        // Draw circle on the beam
        ctx.beginPath();
        ctx.arc(x, y - 10, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Draw small cross inside to indicate hinge
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 4, y - 10);
        ctx.lineTo(x + 4, y - 10);
        ctx.moveTo(x, y - 14);
        ctx.lineTo(x, y - 6);
        ctx.stroke();
        
        // Add label
        ctx.fillStyle = '#dc2626';
        ctx.font = '10px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('IH', x, y - 25);
        
        ctx.restore();
        break;
      default:
        // Handle unknown support types
        console.warn(`Unknown support type: ${type}`);
        break;
    }
    ctx.restore();
  }, [isDarkMode]);

  const drawPointLoad = useCallback((ctx, x, y, load) => {
    const magnitude = load.magnitude || load;
    const angle = load.angle || 0;
    const isInclined = load.isInclined || false;
    
    if (magnitude === 0) return;

    ctx.save();
    ctx.strokeStyle = magnitude > 0 ? '#ef4444' : '#ef4444';
    ctx.fillStyle = magnitude > 0 ? '#ef4444' : '#ef4444';
    ctx.lineWidth = 2;

    if (isInclined) {
      // Draw inclined load
      const angleRad = (angle * Math.PI) / 180;
      const arrowLength = Math.min(50, Math.abs(magnitude) * 5);
      
      // Calculate end point of the arrow
      const endX = x + arrowLength * Math.sin(angleRad);
      const endY = y - arrowLength * Math.cos(angleRad);
      
      // Draw arrow line
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      
      // Draw arrow head
      const headLength = 10;
      const headAngle = Math.PI / 6; // 30 degrees
      
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - headLength * Math.cos(angleRad - headAngle),
        endY + headLength * Math.sin(angleRad - headAngle)
      );
      ctx.lineTo(
        endX - headLength * Math.cos(angleRad + headAngle),
        endY + headLength * Math.sin(angleRad + headAngle)
      );
      ctx.closePath();
      ctx.fill();
      
      // Draw magnitude label with angle
      ctx.fillStyle = isDarkMode ? '#f3f4f6' : '#374151';
      ctx.font = '12px Inter';
      ctx.textAlign = 'center';
      const labelX = x + (arrowLength + 20) * Math.sin(angleRad);
      const labelY = y - (arrowLength + 20) * Math.cos(angleRad);
      ctx.fillText(`${Math.abs(magnitude).toFixed(1)} ${getUnit('force')}`, labelX, labelY);
      ctx.fillText(`∠${angle}°`, labelX, labelY + 12);
    } else {
      // Draw vertical load (existing code)
      const direction = magnitude > 0 ? -1 : 1;
      const arrowLength = Math.min(50, Math.abs(magnitude) * 5);

      // Draw arrow line
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + direction * arrowLength);
      ctx.stroke();

      // Draw arrow head
      ctx.beginPath();
      ctx.moveTo(x, y + direction * arrowLength);
      ctx.lineTo(x - 5, y + direction * (arrowLength - 10));
      ctx.lineTo(x + 5, y + direction * (arrowLength - 10));
      ctx.closePath();
      ctx.fill();

      // Draw magnitude label with units and theme-aware color
      ctx.fillStyle = isDarkMode ? '#f3f4f6' : '#374151';
      ctx.font = '12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.abs(magnitude).toFixed(1)} ${getUnit('force')}`, x, y + direction * (arrowLength + 15));
    }

    ctx.restore();
  }, [isDarkMode, getUnit]);

  const drawDistributedLoad = useCallback((ctx, startX, endX, y, startMag, endMag) => {
    if (startMag === 0 && endMag === 0) return;

    ctx.save();
    ctx.strokeStyle = '#22c55e';
    ctx.fillStyle = '#22c55e';
    ctx.lineWidth = 1;

    const maxMag = Math.max(Math.abs(startMag), Math.abs(endMag));
    
    const startHeight = (Math.abs(startMag) / maxMag) * 40;
    const endHeight = (Math.abs(endMag) / maxMag) * 40;

    // Draw distributed load shape above the beam
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(startX, y - startHeight); // Always go upward from beam
    ctx.lineTo(endX, y - endHeight);     // Always go upward from beam
    ctx.lineTo(endX, y);
    ctx.closePath();
    ctx.globalAlpha = 0.3;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.stroke();

    // Draw arrows pointing downward for downward loads
    const numArrows = Math.max(3, Math.floor((endX - startX) / 20));
    for (let i = 0; i <= numArrows; i++) {
      const x = startX + (i / numArrows) * (endX - startX);
      const mag = startMag + (i / numArrows) * (endMag - startMag);
      const height = (Math.abs(mag) / maxMag) * 40;
      
      if (height > 5) {
        // For downward loads (negative magnitude), draw arrows pointing down
        if (mag < 0) {
          // Arrow pointing downward
          ctx.beginPath();
          ctx.moveTo(x, y - height);
          ctx.lineTo(x - 3, y - height - 6);
          ctx.lineTo(x + 3, y - height - 6);
          ctx.closePath();
          ctx.fill();
        } else {
          // Arrow pointing upward (for upward loads)
          ctx.beginPath();
          ctx.moveTo(x, y - height);
          ctx.lineTo(x - 3, y - height + 6);
          ctx.lineTo(x + 3, y - height + 6);
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    // Draw magnitude labels with units
    if (startMag !== 0) {
      ctx.fillStyle = isDarkMode ? '#f3f4f6' : '#374151';
      ctx.font = '12px Inter';
      ctx.textAlign = 'center';
      const labelY = y - startHeight - 15;
      ctx.fillText(`${Math.abs(startMag).toFixed(1)} ${getUnit('distributedLoad')}`, startX, labelY);
    }
    
    if (endMag !== 0 && endMag !== startMag) {
      ctx.fillStyle = isDarkMode ? '#f3f4f6' : '#374151';
      ctx.font = '12px Inter';
      ctx.textAlign = 'center';
      const labelY = y - endHeight - 15;
      ctx.fillText(`${Math.abs(endMag).toFixed(1)} ${getUnit('distributedLoad')}`, endX, labelY);
    }

    ctx.restore();
  }, [isDarkMode, getUnit]);

  const drawMoment = useCallback((ctx, x, y, magnitude) => {
    if (magnitude === 0) return;

    ctx.save();
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 2;

    const radius = 20;
    const startAngle = magnitude > 0 ? 0 : Math.PI;
    const endAngle = magnitude > 0 ? Math.PI * 1.5 : Math.PI * 1.5;
    const anticlockwise = magnitude > 0 ? false : true;

    // Draw moment arc
    ctx.beginPath();
    ctx.arc(x, y, radius, startAngle, endAngle, anticlockwise);
    ctx.stroke();

    // Draw arrow head
    const arrowX = x + radius * Math.cos(endAngle);
    const arrowY = y + radius * Math.sin(endAngle);
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    if (!anticlockwise) {
      // Clockwise: arrow pointing left/up
      ctx.lineTo(arrowX - 5, arrowY - 5);
      ctx.lineTo(arrowX - 5, arrowY + 5);
    } else {
      // Counterclockwise: flip horizontally, arrow pointing right/up
      ctx.lineTo(arrowX + 5, arrowY - 5);
      ctx.lineTo(arrowX + 5, arrowY + 5);
    }
    ctx.closePath();
    ctx.fill();

    // Draw magnitude label with units
    ctx.fillStyle = isDarkMode ? '#f3f4f6' : '#374151';
    ctx.font = '12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.abs(magnitude).toFixed(1)} ${getUnit('moment')}`, x, y - 35);

    ctx.restore();
  }, [isDarkMode, getUnit]);

  const drawDimensions = useCallback((ctx, startX, y, totalWidth, beamData) => {
    ctx.save();
    // Use theme-aware colors for better visibility
    const dimensionColor = isDarkMode ? '#d1d5db' : '#374151';
    ctx.strokeStyle = dimensionColor;
    ctx.fillStyle = dimensionColor;
    ctx.lineWidth = 1;
    ctx.font = '11px Inter';
    ctx.textAlign = 'center';

    // Collect all significant positions and convert to display units
    const positions = [0, beamData.length];
    beamData.supports.forEach(support => positions.push(support.position));
    beamData.pointLoads.forEach(load => positions.push(load.position));
    beamData.distributedLoads.forEach(load => {
      positions.push(load.startPos);
      positions.push(load.endPos);
    });
    beamData.moments.forEach(moment => positions.push(moment.position));

    const uniquePositions = [...new Set(positions)].sort((a, b) => a - b);
    const displayPositions = uniquePositions.map(pos => convertValue(pos, 'length', 'SI'));

    // Draw dimension line
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(startX + totalWidth, y);
    ctx.stroke();

    // Draw dimension segments
    for (let i = 0; i < displayPositions.length - 1; i++) {
      const pos1 = displayPositions[i];
      const pos2 = displayPositions[i + 1];
      const displayLength = convertValue(beamData.length, 'length', 'SI');
      const x1 = startX + (pos1 / displayLength) * totalWidth;
      const x2 = startX + (pos2 / displayLength) * totalWidth;
      const distance = pos2 - pos1;

      // Draw tick marks
      ctx.beginPath();
      ctx.moveTo(x1, y - 5);
      ctx.lineTo(x1, y + 5);
      ctx.moveTo(x2, y - 5);
      ctx.lineTo(x2, y + 5);
      ctx.stroke();

      // Draw dimension text with units
      if (distance > 0) {
        ctx.fillText(`${distance.toFixed(1)} ${getUnit('length')}`, (x1 + x2) / 2, y + 20);
      }
    }

    ctx.restore();
  }, [isDarkMode, convertValue, getUnit]);

  const drawBeam = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set up coordinate system
    const margin = 80;
    const beamY = height / 2;
    const beamHeight = 20;
    const displayLength = convertValue(beamData.length, 'length', 'SI');
    const scale = (width - 2 * margin) / displayLength;

    // Draw beam
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(margin, beamY - beamHeight/2, displayLength * scale, beamHeight);
    
    // Draw beam outline
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 2;
    ctx.strokeRect(margin, beamY - beamHeight/2, displayLength * scale, beamHeight);

    // Draw supports
    beamData.supports.forEach(support => {
      const displayPos = convertValue(support.position, 'length', 'SI');
      const x = margin + displayPos * scale;
      drawSupport(ctx, x, beamY + beamHeight/2, support.type, support.position, beamData.length);
    });

    // Draw point loads
    beamData.pointLoads.forEach(load => {
      const displayPos = convertValue(load.position, 'length', 'SI');
      const x = margin + displayPos * scale;
      const displayLoad = {
        magnitude: convertValue(load.magnitude, 'force', 'SI'),
        angle: load.angle || 0,
        isInclined: load.isInclined || false
      };
      drawPointLoad(ctx, x, beamY - beamHeight/2, displayLoad);
    });

    // Draw distributed loads
    beamData.distributedLoads.forEach(load => {
      const displayStartPos = convertValue(load.startPos, 'length', 'SI');
      const displayEndPos = convertValue(load.endPos, 'length', 'SI');
      const displayStartMag = convertValue(load.startMag, 'distributedLoad', 'SI');
      const displayEndMag = convertValue(load.endMag, 'distributedLoad', 'SI');
      const startX = margin + displayStartPos * scale;
      const endX = margin + displayEndPos * scale;
      drawDistributedLoad(ctx, startX, endX, beamY - beamHeight/2, displayStartMag, displayEndMag);
    });

    // Draw moments
    beamData.moments.forEach(moment => {
      const displayPos = convertValue(moment.position, 'length', 'SI');
      const displayMag = convertValue(moment.magnitude, 'moment', 'SI');
      const x = margin + displayPos * scale;
      drawMoment(ctx, x, beamY, displayMag);
    });

    // Draw dimensions
    drawDimensions(ctx, margin, beamY + 60, displayLength * scale, beamData);
  }, [beamData, convertValue, drawSupport, drawPointLoad, drawDistributedLoad, drawMoment, drawDimensions]);

  useEffect(() => {
    drawBeam();
  }, [beamData, isDarkMode, convertValue, getUnit, drawSupport, drawPointLoad, drawDistributedLoad, drawMoment, drawDimensions, drawBeam]);

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white">Beam Diagram</h3>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-4 lg:p-6 border border-gray-200 dark:border-gray-600">
          <canvas
            ref={canvasRef}
            width={800}
            height={350}
            className="w-full h-auto border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 shadow-sm"
            id="beam-diagram-canvas"
          />
        </div>
      </div>

      {results.reactions.length > 0 && (
        <div className="card">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white">Reaction Forces</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
            {results.reactions.map((reaction, index) => {
              const support = beamData.supports.find(s => s.position === reaction.position);
              const displayPos = convertValue(reaction.position, 'length', 'SI');
              const displayForce = convertValue(reaction.force, 'force', 'SI');
              const displayMoment = reaction.moment !== undefined ? convertValue(reaction.moment, 'moment', 'SI') : undefined;
              
              return (
                <div key={index} className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 lg:p-5 card-hover">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900 dark:text-blue-200 text-sm lg:text-base">
                      {support?.type === 'Internal Hinge' ? 'Internal Hinge' : 'Support'} at {displayPos.toFixed(2)} {getUnit('length')}
                    </span>
                    <span className="text-blue-700 dark:text-blue-300 font-bold text-sm lg:text-base">
                      {Math.abs(displayForce).toFixed(2)} {getUnit('force')} {reaction.force < 0 ? '↓' : '↑'}
                    </span>
                  </div>
                  {displayMoment !== undefined && (
                    <div className="mt-2 text-xs lg:text-sm text-blue-700 dark:text-blue-300 font-medium">
                      <span className="font-bold">Moment:</span> {Math.abs(displayMoment).toFixed(2)} {getUnit('moment')} {reaction.moment > 0 ? '↻' : '↺'}
                    </div>
                  )}
                  {support?.type === 'Internal Hinge' && (
                    <div className="mt-2 text-xs text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/20 px-2 py-1 rounded-lg font-medium">
                      Internal hinge: Moment = 0 (releases moment)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default BeamDiagram;