import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Hammer, User } from 'lucide-react';
import { AIAssistant as AIAssistantComponent } from '../components/features/AIAssistant';
import { ROUTES } from '../constants/routes';

const AIAssistantPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900">AI Diagnostic Assistant</h2>
        <p className="text-gray-500 mt-2">
          Not sure what's wrong? Describe the problem, and our Gemini-powered AI will suggest the
          right tool or professional.
        </p>
      </div>

      <AIAssistantComponent />

      <div className="grid md:grid-cols-2 gap-6 mt-12">
        <div
          className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-all"
          onClick={() => navigate(ROUTES.STORE)}
        >
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mb-4">
            <Hammer size={24} />
          </div>
          <h3 className="font-bold text-lg mb-2">Buy Tools</h3>
          <p className="text-gray-500 text-sm">
            If the AI suggests a DIY fix, browse our extensive catalog of power and hand tools.
          </p>
        </div>
        <div
          className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-all"
          onClick={() => navigate(ROUTES.SERVICES)}
        >
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
            <User size={24} />
          </div>
          <h3 className="font-bold text-lg mb-2">Hire a Pro</h3>
          <p className="text-gray-500 text-sm">
            For complex or dangerous tasks, connect with one of our verified experts immediately.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPage;
