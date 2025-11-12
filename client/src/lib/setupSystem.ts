export interface SetupStatus {
  configuration: {
    supabaseConfigured: boolean;
    errors: string[];
  };
  database: {
    connected: boolean;
    tablesExist: boolean;
    errors: string[];
  };
  overall: {
    ready: boolean;
    message: string;
  };
}

class SetupSystem {
  async initialize(): Promise<SetupStatus> {
    const status: SetupStatus = {
      configuration: {
        supabaseConfigured: true,
        errors: [],
      },
      database: {
        connected: false,
        tablesExist: false,
        errors: [],
      },
      overall: {
        ready: false,
        message: 'Checking system...',
      },
    };

    try {
      const response = await fetch('/api/flows');
      if (response.ok) {
        status.database.connected = true;
        status.database.tablesExist = true;
        status.overall.ready = true;
        status.overall.message = 'System ready';
      } else {
        status.database.errors.push('Failed to connect to database');
        status.overall.message = 'Database connection failed';
      }
    } catch (error) {
      status.database.errors.push('Unable to reach API server');
      status.overall.message = 'API server unreachable';
    }

    return status;
  }
}

export const setupSystem = new SetupSystem();
