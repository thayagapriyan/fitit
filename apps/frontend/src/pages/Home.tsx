import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Zap, Hammer, User, ArrowRight } from 'lucide-react';
import { ROUTES } from '../constants/routes';
import { TOOLS_DATA } from '../constants/originalConstants';
import { Product, UserRole } from '../types';

interface LayoutContext {
  role: UserRole;
  setRole: (role: UserRole) => void;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useOutletContext<LayoutContext>();

  const addToCart = (product: Product) => {
    alert(`Added ${product.name} to cart!`);
  };

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <div className="relative bg-slate-900 text-white rounded-3xl overflow-hidden p-8 md:p-16 flex flex-col md:flex-row items-center gap-8 shadow-2xl">
        <div className="flex-1 space-y-6 z-10">
          <div className="inline-block bg-blue-600/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            The #1 Home Services Platform
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
            Fix your home.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Faster than ever.
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-lg">
            Whether you need a pro or just the right tool, FixItHub connects you with everything needed to solve household issues.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate(ROUTES.AI_ASSISTANT)}
              className="bg-white text-slate-900 hover:bg-gray-100 px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <Zap className="text-yellow-500" /> AI Diagnose
            </button>
            <button
              onClick={() => navigate(ROUTES.SERVICES)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/25"
            >
              Find a Pro
            </button>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-blue-900/50 to-transparent pointer-events-none"></div>
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Featured Tools Preview */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Popular Tools</h2>
            <p className="text-gray-500">Essential gear for your DIY projects</p>
          </div>
          <button
            onClick={() => navigate(ROUTES.STORE)}
            className="text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1"
          >
            View Store <ArrowRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TOOLS_DATA.slice(0, 4).map(product => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-100 flex flex-col h-full"
            >
              <div className="relative h-48 bg-gray-100">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full text-xs font-bold shadow-sm text-gray-700">
                  ⭐ {product.rating}
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="text-xs text-blue-600 font-semibold mb-1 uppercase tracking-wider">
                  {product.category}
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{product.name}</h3>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-1">{product.description}</p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                  <span className="text-xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
                  <button
                    onClick={() => addToCart(product)}
                    className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
