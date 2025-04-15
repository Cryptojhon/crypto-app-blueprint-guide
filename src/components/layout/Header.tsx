
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DollarSign, LogOut } from 'lucide-react';

const Header: React.FC = () => {
  const { balance, totalValue, addFunds } = usePortfolio();
  const { isAdmin, signOut } = useAuth();
  const [fundAmount, setFundAmount] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddFunds = () => {
    const amount = parseFloat(fundAmount);
    if (!isNaN(amount) && amount > 0) {
      addFunds(amount);
      setFundAmount('');
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="border-b border-b-border bg-card py-3 px-6">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-500">
              CryptoTrader
            </span>
          </h1>
        </div>

        <div className="flex flex-col md:flex-row items-center mt-4 md:mt-0 gap-4">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Portfolio Value</div>
              <div className="text-xl font-bold">
                ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-muted-foreground">Available Balance</div>
              <div className="text-xl font-bold">
                ${balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex gap-2">
                    <DollarSign size={16} />
                    Add Funds
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Funds to Your Account</DialogTitle>
                    <DialogDescription>
                      Enter the amount you want to add to your trading balance.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="flex items-center space-x-2 mt-4">
                    <DollarSign className="text-muted-foreground" size={20} />
                    <Input 
                      type="number" 
                      placeholder="Amount" 
                      value={fundAmount} 
                      onChange={(e) => setFundAmount(e.target.value)}
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddFunds}>Add Funds</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            
            <Button variant="outline" onClick={signOut}>
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
