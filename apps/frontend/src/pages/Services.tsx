import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { useServiceProfiles } from '../hooks';
import { SERVICE_PROS } from '../constants/originalConstants';
import { UserRole, ServiceProfile } from '../types';

interface LayoutContext {
  role: UserRole;
  setRole: (role: UserRole) => void;
}

const Services: React.FC = () => {
  const { role } = useOutletContext<LayoutContext>();
  const { data: profiles, loading, error } = useServiceProfiles();
  
  // Fallback to constants if API fails or is loading
  const displayProfiles = profiles || SERVICE_PROS;

  const ServiceCard = ({ profile }: { profile: ServiceProfile }) => (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 p-6 flex items-start gap-4">
      <img
        src={profile.image}
        alt={profile.name}
        className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
      />
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg text-gray-900">{profile.name}</h3>
            <p className="text-blue-600 font-medium text-sm">{profile.profession}</p>
          </div>
          <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-lg">
            <span className="text-yellow-600 text-sm font-bold">★ {profile.rating}</span>
          </div>
        </div>
        <p className="text-gray-500 text-sm mt-2">Rate: ${profile.rate}/hr</p>
        <div className="mt-4 flex gap-2">
          {role === UserRole.CUSTOMER ? (
            <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">
              Contact
            </button>
          ) : (
            <span className="text-xs text-gray-400 italic">Peer Professional</span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Expert Professionals</h2>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Vetted experts ready to tackle your electrical, plumbing, and carpentry needs.
        </p>
      </div>
      
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <span className="ml-2 text-gray-500">Loading professionals...</span>
        </div>
      )}
      
      {/* Error State */}
      {error && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-yellow-600" size={20} />
          <span className="text-yellow-700 text-sm">
            Unable to fetch live data. Showing cached professionals.
          </span>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayProfiles.map(profile => (
          <ServiceCard key={profile.id} profile={profile} />
        ))}
      </div>
    </div>
  );
};

export default Services;
