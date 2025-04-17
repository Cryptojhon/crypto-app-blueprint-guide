import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePortfolio } from '@/contexts/PortfolioContext';
import FundsManagement from '@/components/portfolio/FundsManagement';
import ReferralSystem from '@/components/portfolio/ReferralSystem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowUpIcon, ArrowDownIcon, CoinsIcon, HistoryIcon, Wallet2Icon, CreditCardIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const WalletManagement = () => {
  const { user } = useAuth();
  const { balance, totalValue } = usePortfolio();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Wallet2Icon className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Wallet Management</h1>
      </div>
      
      <Tabs defaultValue="overview" onValueChange={setActiveTab} value={activeTab} className="mb-8">
        <TabsList className="grid w-full md:w-1/2 grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="manage">Manage Funds</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCardIcon className="h-4 w-4 text-primary" />
                  Available Balance
                </CardTitle>
                <CardDescription>Cash available for trading</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">${balance.toLocaleString()}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Portfolio Value</CardTitle>
                <CardDescription>Including assets and cash</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">${totalValue.toLocaleString()}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <CardDescription>Last 3 transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentTransactions userId={user?.id} />
              </CardContent>
              <CardFooter className="pt-0">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full" 
                  asChild
                >
                  <Link to="/transactions" className="flex items-center justify-center">
                    <HistoryIcon className="mr-2 h-4 w-4" />
                    View Full Transaction History
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ReferralSystem />
            <Button 
              variant="default" 
              size="lg" 
              className="md:hidden h-12" 
              onClick={() => setActiveTab('manage')}
            >
              Manage Funds
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="manage">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FundsManagement />
            <Button 
              variant="outline" 
              size="lg" 
              className="md:hidden h-12" 
              onClick={() => setActiveTab('overview')}
            >
              Back to Overview
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Component to display recent transactions
const RecentTransactions = ({ userId }: { userId?: string }) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!userId) return;
      
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(3);
          
        if (error) throw error;
        setTransactions(data || []);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransactions();
  }, [userId]);
  
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-6 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }
  
  if (transactions.length === 0) {
    return <p className="text-sm text-muted-foreground">No recent transactions</p>;
  }
  
  return (
    <div className="space-y-2">
      {transactions.map((tx) => {
        const isDeposit = tx.type === 'deposit';
        const isWithdrawal = tx.type === 'withdraw';
        
        return (
          <div key={tx.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isDeposit && <ArrowUpIcon className="h-4 w-4 text-green-500" />}
              {isWithdrawal && <ArrowDownIcon className="h-4 w-4 text-red-500" />}
              {!isDeposit && !isWithdrawal && <CoinsIcon className="h-4 w-4 text-blue-500" />}
              <span className="text-sm capitalize">
                {tx.type} {!isDeposit && !isWithdrawal && tx.asset_id}
              </span>
            </div>
            <span className={`text-sm font-medium ${isDeposit ? 'text-green-500' : isWithdrawal ? 'text-red-500' : ''}`}>
              {isDeposit ? '+' : isWithdrawal || tx.type === 'sell' ? '-' : ''}
              ${tx.total_value.toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default WalletManagement;
