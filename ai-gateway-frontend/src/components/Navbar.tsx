'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clearAuth, getUser } from '@/lib/auth';

export default function Navbar() {
  const router = useRouter();
  const user = getUser();

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex space-x-8">
            <Link href="/dashboard" className="flex items-center text-gray-900 font-semibold">
              AI Gateway
            </Link>
            <Link href="/dashboard/providers" className="flex items-center text-gray-600 hover:text-gray-900">
              Providers
            </Link>
            <Link href="/dashboard/routers" className="flex items-center text-gray-600 hover:text-gray-900">
              Routers
            </Link>
            <Link href="/dashboard/keys" className="flex items-center text-gray-600 hover:text-gray-900">
              Keys
            </Link>
            <Link href="/dashboard/pricing" className="flex items-center text-gray-600 hover:text-gray-900">
              Pricing
            </Link>
            <Link href="/dashboard/logs" className="flex items-center text-gray-600 hover:text-gray-900">
              Logs
            </Link>
            <Link href="/dashboard/usage" className="flex items-center text-gray-600 hover:text-gray-900">
              📖 Usage
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
              {user?.plan}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
