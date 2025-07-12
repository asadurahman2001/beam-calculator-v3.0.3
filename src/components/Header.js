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
      <header className="bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-4 transition-all duration-200 mobile-header shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-3 min-w-0 flex-1 lg:flex-none">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">Beam Calculator</h1>
              <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 hidden sm:block font-medium">SFD, BMD & Deflection Analysis</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 lg:space-x-3 flex-wrap">
            {/* Unit System Toggle */}
            <div className="flex items-center space-x-2 order-1 lg:order-none">
              <button
                onClick={toggleUnitSystem}
                className="flex items-center space-x-1 lg:space-x-2 px-3 lg:px-4 py-2 lg:py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-200 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95"
              >
                <span className="hidden sm:inline">{units.name}</span>
                <span className="sm:hidden">{units.name.split(' ')[0]}</span>
                <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
            <button
              className="order-2 lg:order-none p-2 lg:p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95"
              onClick={toggleDarkMode}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? (
                <svg className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            {/* Action Buttons - Hidden on small screens, shown in mobile menu */}
            <div className="hidden lg:flex items-center space-x-2">
              <button 
                onClick={handleExportResults}
                disabled={isExporting}
                className="btn-secondary text-sm flex items-center space-x-2 min-w-0"
              >
                {isExporting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="hidden xl:inline">Exporting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="hidden xl:inline">Export</span>
                  </>
                )}
              </button>
              
              <button 
                onClick={handleSaveProject}
                className="btn-secondary text-sm flex items-center space-x-2 min-w-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span className="hidden xl:inline">Save</span>
              </button>
            </div>
            
            {/* Mobile Action Button */}
            <button 
              onClick={handleSaveProject}
              className="lg:hidden btn-primary text-sm flex items-center space-x-1 order-3 min-w-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span>Save</span>
            </button>
            
            {user ? (
              <div className="flex items-center space-x-2 lg:space-x-3 order-4 lg:order-none">
                <button 
                  onClick={handleMyProjects}
                  className="btn-secondary text-sm flex items-center space-x-1 lg:space-x-2 min-w-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span className="hidden lg:inline">My Projects</span>
                  <span className="lg:hidden">Projects</span>
                </button>
                
                <div className="flex items-center space-x-2 px-3 lg:px-4 py-2 lg:py-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-xl shadow-sm">
                  <div className="w-7 h-7 bg-gradient-to-r from-primary-600 to-primary-700 rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-xs font-medium text-white">
                      {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden lg:inline max-w-32 truncate">
                    {user.user_metadata?.full_name || user.email}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-all duration-200 p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
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
                className="btn-primary text-sm flex items-center space-x-1 lg:space-x-2 order-4 lg:order-none min-w-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Sign In</span>
              </button>
            )}
            
            <button 
              className="order-6 lg:order-none btn-secondary text-sm px-3 py-2 lg:py-3 min-w-0"
              onClick={handleExportResults}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Export</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Export</span>
                </>
              )}
            </button>
            
            <button 
              className="order-6 lg:order-none btn-secondary text-sm px-3 py-2 lg:py-3 min-w-0"
              onClick={() => setShowAboutModal(true)}
            >
              <span className="hidden lg:inline">About</span>
              <svg className="w-4 h-4 lg:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
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