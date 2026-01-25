import React from 'react';
import { Wrench } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <div className="bg-gray-900 p-1.5 rounded-lg">
              <Wrench className="text-white h-4 w-4" />
            </div>
            <span className="font-bold text-lg text-gray-900">FixItHub</span>
          </div>
          <p className="text-gray-400 text-sm">
            &copy; 2024 FixItHub. All rights reserved. Powered by Google Gemini.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
