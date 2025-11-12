import { useState, useEffect } from 'react';
import FlowList from './components/FlowList';
import NewFlowBuilder from './components/NewFlowBuilder';
import Settings from './components/Settings';
import Auth from './components/Auth';
import { supabase } from './lib/api';
import { setupSystem, SetupStatus } from './lib/setupSystem';

type View = 'list' | 'builder' | 'settings';

function App() {
  const [currentView, setCurrentView] = useState<View>('list');
  const [selectedFlowId, setSelectedFlowId] = useState<string | undefined>();
  const [showSettings, setShowSettings] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      console.log('🚀 Initializing application...');

      const status = await setupSystem.initialize();
      setSetupStatus(status);

      if (!status.overall.ready) {
        console.error('❌ Setup failed:', status);
      } else {
        console.log('✅ Setup complete');
      }

      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setLoading(false);
      });
    };

    initializeApp();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleCreateNew = () => {
    setSelectedFlowId(undefined);
    setCurrentView('builder');
  };

  const handleEditFlow = (flowId: string) => {
    setSelectedFlowId(flowId);
    setCurrentView('builder');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedFlowId(undefined);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
          <div className="text-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Setting Up Application</h2>
            {setupStatus && (
              <div className="text-left mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Configuration:</span>
                  <span className={setupStatus.configuration.supabaseConfigured ? 'text-green-600' : 'text-red-600'}>
                    {setupStatus.configuration.supabaseConfigured ? '✓ Ready' : '✗ Failed'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Database Connection:</span>
                  <span className={setupStatus.database.connected ? 'text-green-600' : 'text-red-600'}>
                    {setupStatus.database.connected ? '✓ Connected' : '✗ Disconnected'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Database Tables:</span>
                  <span className={setupStatus.database.tablesExist ? 'text-green-600' : 'text-red-600'}>
                    {setupStatus.database.tablesExist ? '✓ Ready' : '✗ Missing'}
                  </span>
                </div>
                {(setupStatus.database.errors.length > 0 || setupStatus.configuration.errors.length > 0) && (
                  <div className="mt-4 p-3 bg-red-50 rounded text-xs text-red-800">
                    <p className="font-semibold mb-1">Errors:</p>
                    {[...setupStatus.configuration.errors, ...setupStatus.database.errors].map((error, i) => (
                      <p key={i}>• {error}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (setupStatus && !setupStatus.overall.ready) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
          <div className="text-center">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Setup Incomplete</h2>
            <p className="text-gray-600 mb-4">{setupStatus.overall.message}</p>
            <div className="text-left mt-4 space-y-2 text-sm">
              {setupStatus.configuration.errors.map((error, i) => (
                <p key={`config-${i}`} className="text-red-600">• {error}</p>
              ))}
              {setupStatus.database.errors.map((error, i) => (
                <p key={`db-${i}`} className="text-red-600">• {error}</p>
              ))}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Retry Setup
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth onAuthSuccess={() => setLoading(false)} />;
  }

  if (currentView === 'builder') {
    return (
      <NewFlowBuilder
        flowId={selectedFlowId}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <>
      <FlowList
        onCreateNew={handleCreateNew}
        onEditFlow={handleEditFlow}
        onOpenSettings={() => setShowSettings(true)}
      />
      {showSettings && (
        <Settings onClose={() => setShowSettings(false)} />
      )}
    </>
  );
}

export default App;
