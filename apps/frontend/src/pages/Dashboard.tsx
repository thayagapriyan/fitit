import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Briefcase, Loader2, AlertCircle } from 'lucide-react';
import { useServiceRequests, useOpenRequests } from '../hooks';
import { serviceRequestsApi } from '../services/api';
import { INITIAL_REQUESTS } from '../constants/originalConstants';
import { UserRole, ServiceRequest } from '../types';

interface LayoutContext {
  role: UserRole;
  setRole: (role: UserRole) => void;
}

const Dashboard: React.FC = () => {
  const { role } = useOutletContext<LayoutContext>();
  const { data: apiRequests, loading, error, refetch } = useServiceRequests();
  const [localRequests, setLocalRequests] = useState<ServiceRequest[]>([]);

  // Combine API data with local changes
  const requests = apiRequests || INITIAL_REQUESTS;

  useEffect(() => {
    setLocalRequests(requests);
  }, [requests]);

  const acceptJob = async (id: string) => {
    try {
      // Try to update via API
      await serviceRequestsApi.acceptJob(id, 'current-professional');
      // Refresh data
      refetch();
    } catch {
      // Fallback to local state
      setLocalRequests(prev =>
        prev.map(req => (req.id === id ? { ...req, status: 'IN_PROGRESS' as const } : req))
      );
    }
  };

  const postJob = async (desc: string, cat: string) => {
    const newReq: ServiceRequest = {
      id: Date.now().toString(),
      customerId: 'current-user',
      customerName: 'You',
      description: desc,
      category: cat,
      status: 'OPEN',
      date: new Date().toLocaleDateString(),
    };

    try {
      // Try to create via API
      await serviceRequestsApi.create({
        customerId: 'current-user',
        customerName: 'You',
        description: desc,
        category: cat,
      });
      refetch();
      alert('Job Posted Successfully!');
    } catch {
      // Fallback to local state
      setLocalRequests(prev => [newReq, ...prev]);
      alert('Job Posted Successfully! (Local only)');
    }
  };

  const RequestCard = ({ request }: { request: ServiceRequest }) => (
    <div className="bg-white rounded-xl shadow-sm border border-l-4 border-l-blue-500 border-gray-100 p-5">
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded uppercase tracking-wide mb-2">
            {request.category}
          </span>
          <h3 className="font-bold text-gray-900">{request.customerName}</h3>
        </div>
        <span className="text-xs text-gray-400">{request.date}</span>
      </div>
      <p className="text-gray-600 text-sm mb-4 bg-gray-50 p-3 rounded-lg">{request.description}</p>
      <div className="flex justify-end">
        {request.status === 'OPEN' ? (
          <button
            onClick={() => acceptJob(request.id)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Briefcase size={16} /> Accept Job
          </button>
        ) : (
          <span className="text-green-600 font-medium text-sm flex items-center gap-1">✓ Accepted</span>
        )}
      </div>
    </div>
  );

  // Loading indicator
  const LoadingIndicator = () => (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="animate-spin text-blue-600" size={32} />
      <span className="ml-2 text-gray-500">Loading requests...</span>
    </div>
  );

  // Error banner
  const ErrorBanner = () => (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
      <AlertCircle className="text-yellow-600" size={20} />
      <span className="text-yellow-700 text-sm">
        Unable to fetch live data. Working in offline mode.
      </span>
    </div>
  );

  if (role === UserRole.PROFESSIONAL) {
    const openRequests = localRequests.filter(r => r.status === 'OPEN');
    
    return (
      <div className="space-y-6">
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Pro Dashboard</h2>
            <p className="text-gray-400">Welcome back! You have open requests.</p>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-lg">
            <span className="text-2xl font-bold">{openRequests.length}</span>
            <span className="text-sm ml-2 opacity-80">New Leads</span>
          </div>
        </div>
        
        {loading && <LoadingIndicator />}
        {error && !loading && <ErrorBanner />}
        
        <div className="grid gap-6">
          <h3 className="font-bold text-lg text-gray-800">Available Jobs</h3>
          {localRequests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300 text-gray-500">
              No open requests at the moment. Check back later!
            </div>
          ) : (
            localRequests.map(req => <RequestCard key={req.id} request={req} />)
          )}
        </div>
      </div>
    );
  }

  // Customer Dashboard
  return (
    <div className="space-y-6">
      {loading && <LoadingIndicator />}
      {error && !loading && <ErrorBanner />}
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Post a Service Request</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const desc = (form.elements.namedItem('desc') as HTMLTextAreaElement).value;
            const cat = (form.elements.namedItem('cat') as HTMLSelectElement).value;
            postJob(desc, cat);
            form.reset();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Issue Category</label>
            <select
              name="cat"
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Electrical">Electrical</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Carpenter">Carpenter</option>
              <option value="General">General Handyman</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="desc"
              rows={4}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe your issue in detail..."
              required
            ></textarea>
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-colors"
          >
            Post Request
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-lg text-gray-800">My Requests</h3>
        {localRequests
          .filter(r => r.customerId === 'current-user' || r.customerId === 'You')
          .map(req => (
            <div
              key={req.id}
              className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center"
            >
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase">{req.category}</span>
                <p className="text-gray-800 font-medium">{req.description}</p>
                <p className="text-xs text-gray-400 mt-1">{req.date}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  req.status === 'OPEN'
                    ? 'bg-yellow-100 text-yellow-700'
                    : req.status === 'IN_PROGRESS'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {req.status}
              </span>
            </div>
          ))}
        {localRequests.filter(r => r.customerId === 'current-user' || r.customerId === 'You').length === 0 && (
          <p className="text-gray-500 text-sm">You haven't posted any requests yet.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
