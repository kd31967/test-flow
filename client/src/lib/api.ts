// API client to replace Supabase client with compatibility layer
class QueryBuilder {
  constructor(private table: string, private filters: any = {}) {}

  select(columns = '*') {
    return this;
  }

  eq(column: string, value: any) {
    this.filters[column] = value;
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    // We'll ignore ordering for now in the simple in-memory implementation
    return this;
  }

  limit(count: number) {
    return this;
  }

  single() {
    return this.execute().then(result => ({
      ...result,
      data: result.data?.[0] || null
    }));
  }

  async execute() {
    try {
      let url = '';
      let method = 'GET';
      let body: any = null;

      if (this.table === 'flows') {
        if (this.filters.id) {
          url = `/api/flows/${this.filters.id}`;
          const response = await fetch(url);
          const data = response.ok ? await response.json() : null;
          return { data: data ? [data] : [], error: null };
        }
        url = '/api/flows';
      } else if (this.table === 'user_profiles') {
        url = '/api/profile';
      }

      const response = await fetch(url);
      if (!response.ok) {
        return { data: null, error: new Error(`HTTP ${response.status}`) };
      }

      let data = await response.json();
      if (!Array.isArray(data)) {
        data = [data];
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Make it awaitable
  then(resolve: any, reject: any) {
    return this.execute().then(resolve, reject);
  }
}

class UpdateBuilder {
  constructor(private table: string, private updates: any) {}

  eq(column: string, value: any) {
    this.filters = { ...this.filters, [column]: value };
    return this;
  }

  private filters: any = {};

  async execute() {
    try {
      if (this.table === 'flows' && this.filters.id) {
        const response = await fetch(`/api/flows/${this.filters.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.updates),
        });

        if (!response.ok) {
          return { data: null, error: new Error(`HTTP ${response.status}`) };
        }

        const data = await response.json();
        return { data, error: null };
      } else if (this.table === 'user_profiles' && this.filters.id) {
        const response = await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.updates),
        });

        if (!response.ok) {
          return { data: null, error: new Error(`HTTP ${response.status}`) };
        }

        const data = await response.json();
        return { data, error: null };
      }

      return { data: null, error: new Error('Unsupported operation') };
    } catch (error) {
      return { data: null, error };
    }
  }

  then(resolve: any, reject: any) {
    return this.execute().then(resolve, reject);
  }
}

class DeleteBuilder {
  constructor(private table: string, private filters: any = {}) {}

  eq(column: string, value: any) {
    this.filters[column] = value;
    return this;
  }

  async execute() {
    try {
      if (this.table === 'flows' && this.filters.id) {
        const response = await fetch(`/api/flows/${this.filters.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          return { data: null, error: new Error(`HTTP ${response.status}`) };
        }

        return { data: null, error: null };
      }

      return { data: null, error: new Error('Unsupported operation') };
    } catch (error) {
      return { data: null, error };
    }
  }

  then(resolve: any, reject: any) {
    return this.execute().then(resolve, reject);
  }
}

class InsertBuilder {
  constructor(private table: string, private data: any) {}

  select() {
    return this;
  }

  async execute() {
    try {
      if (this.table === 'flows') {
        const response = await fetch('/api/flows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.data),
        });

        if (!response.ok) {
          return { data: null, error: new Error(`HTTP ${response.status}`) };
        }

        const result = await response.json();
        return { data: [result], error: null };
      } else if (this.table === 'user_profiles') {
        const response = await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.data),
        });

        if (!response.ok) {
          return { data: null, error: new Error(`HTTP ${response.status}`) };
        }

        const result = await response.json();
        return { data: [result], error: null };
      }

      return { data: null, error: new Error('Unsupported operation') };
    } catch (error) {
      return { data: null, error };
    }
  }

  then(resolve: any, reject: any) {
    return this.execute().then(resolve, reject);
  }
}

class ApiClient {
  private userId = 'demo-user';

  from(table: string) {
    return {
      select: (columns = '*') => new QueryBuilder(table),
      update: (data: any) => new UpdateBuilder(table, data),
      insert: (data: any) => new InsertBuilder(table, data),
      delete: () => new DeleteBuilder(table),
    };
  }

  // Mock auth methods (no real auth needed for demo)
  auth = {
    getSession: async () => ({
      data: {
        session: {
          user: { id: this.userId, email: 'demo@example.com' }
        }
      }
    }),
    getUser: async () => ({
      data: {
        user: { id: this.userId, email: 'demo@example.com' }
      },
      error: null
    }),
    onAuthStateChange: (callback: any) => {
      setTimeout(() => {
        callback('SIGNED_IN', {
          user: { id: this.userId, email: 'demo@example.com' }
        });
      }, 0);
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    signInWithPassword: async () => ({
      data: {
        session: {
          user: { id: this.userId, email: 'demo@example.com' }
        }
      },
      error: null
    }),
    signOut: async () => ({ error: null }),
  };
}

export const apiClient = new ApiClient();
export const supabase = apiClient;
