
import { Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Wallet, LineChart, LogOut, User, Menu, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const Header = () => {
  const { user, signOut, loading } = useAuth();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleSignOut = async () => {
    await signOut();
    toggleMenu();
  };

  return (
    <header className="bg-background sticky top-0 z-10 w-full border-b">
      <div className="container mx-auto flex h-16 items-center px-4">
        <div className="flex flex-1">
          <Link to="/" className="font-bold text-xl mr-8">CryptoTrade</Link>
        </div>
        {isMobile ? (
          <>
            <button
              onClick={toggleMenu}
              className="p-2 rounded-md"
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>

            {menuOpen && (
              <div className="absolute top-16 left-0 right-0 bg-background border-b p-4 flex flex-col space-y-2">
                {!loading && user ? (
                  <>
                    <Link
                      to="/"
                      className="flex items-center px-4 py-2 hover:bg-accent rounded-md"
                      onClick={toggleMenu}
                    >
                      <LineChart className="mr-2 h-4 w-4" />
                      Markets
                    </Link>
                    <Link
                      to="/wallet"
                      className="flex items-center px-4 py-2 hover:bg-accent rounded-md"
                      onClick={toggleMenu}
                    >
                      <Wallet className="mr-2 h-4 w-4" />
                      Wallet
                    </Link>
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 hover:bg-accent rounded-md"
                      onClick={toggleMenu}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={handleSignOut}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <Link
                    to="/auth"
                    className="flex items-center px-4 py-2 hover:bg-accent rounded-md"
                    onClick={toggleMenu}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Login
                  </Link>
                )}
              </div>
            )}
          </>
        ) : (
          <nav className="flex items-center space-x-4">
            {!loading && user ? (
              <>
                <Link
                  to="/"
                  className="text-sm font-medium transition-colors hover:text-primary flex items-center"
                >
                  <LineChart className="mr-1 h-4 w-4" />
                  Markets
                </Link>
                <Link
                  to="/wallet"
                  className="text-sm font-medium transition-colors hover:text-primary flex items-center"
                >
                  <Wallet className="mr-1 h-4 w-4" />
                  Wallet
                </Link>
                <Link
                  to="/profile"
                  className="text-sm font-medium transition-colors hover:text-primary flex items-center"
                >
                  <User className="mr-1 h-4 w-4" />
                  Profile
                </Link>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  <LogOut className="mr-1 h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button size="sm">
                  <User className="mr-1 h-4 w-4" />
                  Login
                </Button>
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
