import React, { useState, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useWebSocket } from '@/hooks/useWebSocket';
import { toast } from 'sonner';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = () => {
  const { user, logout } = useAuth();
  const { socket } = useWebSocket();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'MarketPlace', path: '/marketplace' }
  ];

  useEffect(() => {
    if (socket) {
      const handleConnect = () => {
        console.log('Connected to WebSocket server from Layout');
      };

      const handleDisconnect = () => {
        console.log('Disconnected from WebSocket server from Layout');
      };

      const handleConnectError = (error: Error) => {
        console.error('WebSocket connection error from Layout:', error);
        toast.error('Connection error. Please check your network.');
      };

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      socket.on('connect_error', handleConnectError);

      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        socket.off('connect_error', handleConnectError);
      };
    }
  }, [socket]);

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="flex-shrink-0 flex items-center">
                <Icons.Lock className="h-8 w-8 text-primary" />
                <span className="ml-2 text-xl font-bold">SlotSwapper</span>
              </Link>
            </div>

            <div className="hidden md:flex md:items-center md:space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className=" hover:text-primary font-medium"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            

            <div className="hidden md:flex md:items-center">
              <div className="flex items-center space-x-3">
                            <ThemeToggle />
                <span className="text-sm font-medium">Welcome , {user?.name}</span>
                <Button variant="outline" size="sm" onClick={logout}>
                  Logout
                </Button>
              </div>
            </div>

            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md  hover:text-primary focus:outline-none"
              >
                {isMenuOpen ? (
                  <Icons.X className="block h-6 w-6" />
                ) : (
                  <Icons.Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className="block px-3 py-2 rounded-md text-base font-medium hover:text-primary hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="mt-4 px-3 py-2 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{user?.name}</span>
                  <Button variant="outline" size="sm" onClick={logout}>
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-grow">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;