import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '../lib/queryClient';
import type { Flow } from '@shared/schema';

export default function HomePage() {
  const { data: flows, isLoading } = useQuery<Flow[]>({
    queryKey: ['/api/flows'],
  });

  const createFlowMutation = useMutation({
    mutationFn: async (flowData: any) => {
      return apiRequest('/api/flows', {
        method: 'POST',
        body: JSON.stringify(flowData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/flows'] });
    },
  });

  const handleCreateFlow = () => {
    createFlowMutation.mutate({
      name: 'New Flow',
      description: 'My first flow',
      status: 'draft',
      triggerKeywords: ['hello'],
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">WhatsApp Flow Builder</h1>
          <button
            onClick={handleCreateFlow}
            disabled={createFlowMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            data-testid="button-create-flow"
          >
            {createFlowMutation.isPending ? 'Creating...' : 'Create New Flow'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Your Flows</h2>
          {flows && flows.length > 0 ? (
            <div className="space-y-4">
              {flows.map((flow) => (
                <div
                  key={flow.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  data-testid={`card-flow-${flow.id}`}
                >
                  <h3 className="font-semibold text-lg">{flow.name}</h3>
                  <p className="text-gray-600">{flow.description}</p>
                  <div className="mt-2 flex gap-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {flow.status}
                    </span>
                    {Array.isArray(flow.triggerKeywords) && flow.triggerKeywords.length > 0 && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                        Keywords: {flow.triggerKeywords.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No flows yet. Create your first flow to get started!</p>
          )}
        </div>

        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-2">✅ Migration Complete!</h3>
          <p className="text-green-800">
            Successfully migrated from Supabase to Replit PostgreSQL with Drizzle ORM.
            The app is now running with in-memory storage and ready for database integration.
          </p>
          <div className="mt-4 space-y-1 text-sm text-green-700">
            <div>✓ Express server with API routes</div>
            <div>✓ Drizzle ORM schema</div>
            <div>✓ In-memory storage implementation</div>
            <div>✓ React Query for data fetching</div>
            <div>✓ All Supabase Edge Functions migrated to API routes</div>
          </div>
        </div>
      </div>
    </div>
  );
}
