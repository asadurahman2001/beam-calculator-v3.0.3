import React, { useState } from 'react';
import AboutModal from './AboutModal';
import SignInModal from './auth/SignInModal';
import ProjectsModal from './projects/ProjectsModal';
import SaveProjectModal from './projects/SaveProjectModal';
import { exportResultsToPDF } from '../utils/exportUtils';
import { useTheme } from '../contexts/ThemeContext';
import { useUnits } from '../contexts/UnitContext';
import { useAuth } from '../contexts/AuthContext';

const Header = ({ beamData, results, updateBeamData }) => {
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { toggleUnitSystem, units } = useUnits();
  const { user, signOut } = useAuth();

  const handleExportResults = async () => {
    if (!results || !results.shearForce || results.shearForce.x.length === 0) {
      alert('No analysis results to export. Please configure the beam and run analysis first.');
      return;
    }

    setIsExporting(true);
    try {
      // Wait a moment for any pending renders to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const result = await exportResultsToPDF(beamData, results);
      if (result.success) {
        alert(`Results exported successfully as ${result.fileName}`);
      } else {
        alert(`Export failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveProject = () => {
    if (user) {
      setShowSaveModal(true);
    } else {
      setShowSignInModal(true);
    }
  };

  const handleMyProjects = () => {
    if (user) {
      setShowProjectsModal(true);
    } else {
      setShowSignInModal(true);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleLoadProject = (projectData) => {
    updateBeamData(projectData);
  };

  return (
    <>
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Beam Calculator</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">SFD, BMD & Deflection Analysis</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Unit System Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-300"></span>
              <button
                onClick={toggleUnitSystem}
                className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                <span>{units.name}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </button>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? (
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            <button 
              onClick={handleExportResults}
              disabled={isExporting}
              className="btn-secondary text-sm flex items-center space-x-2"
            >
              {isExporting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Export Results</span>
                </>
              )}
            </button>
            <button 
              onClick={handleSaveProject}
              className="btn-secondary text-sm flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span>Save Project</span>
            </button>
            
            {user ? (
              <div className="flex items-center space-x-3">
                <button 
                  onClick={handleMyProjects}
                  className="btn-secondary text-sm flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span>My Projects</span>
                </button>
                
                <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-white">
                      {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {user.user_metadata?.full_name || user.email}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    title="Sign Out"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setShowSignInModal(true)}
                className="btn-primary text-sm flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Sign In</span>
              </button>
            )}
            
            <button 
              onClick={() => setShowAboutModal(true)}
              className="btn-secondary text-sm"
            >
              About
            </button>
          </div>
        </div>
      </header>

      {showAboutModal && (
        <AboutModal onClose={() => setShowAboutModal(false)} />
      )}

      <SignInModal 
        isOpen={showSignInModal} 
        onClose={() => setShowSignInModal(false)} 
      />

      <ProjectsModal 
        isOpen={showProjectsModal} 
        onClose={() => setShowProjectsModal(false)}
        onLoadProject={handleLoadProject}
      />

      <SaveProjectModal 
        isOpen={showSaveModal} 
        onClose={() => setShowSaveModal(false)}
        beamData={beamData}
      />
    </>
  );
};

export default Header;