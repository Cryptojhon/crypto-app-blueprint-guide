
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Table, TableBody, TableCaption, TableCell, 
  TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowUpIcon, ArrowDownIcon, CoinsIcon, 
  SearchIcon, FilterIcon, CalendarIcon,
  ChevronLeftIcon, ChevronRightIcon
} from 'lucide-react';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  type: string;
  asset_id: string;
  amount: number;
  price: number;
  total_value: number;
  status: string;
  created_at: string;
}

const TransactionHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateSort, setDateSort] = useState<'desc' | 'asc'>('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Fetch transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: dateSort === 'asc' });
          
        if (error) throw error;
        
        setTransactions(data || []);
        setFilteredTransactions(data || []);
      } catch (error: any) {
        console.error('Error fetching transactions:', error);
        setError(error.message || 'Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransactions();
  }, [user, dateSort]);

  // Handle filtering
  useEffect(() => {
    let result = [...transactions];
    
    // Apply type filter
    if (typeFilter !== 'all') {
      result = result.filter(tx => tx.type === typeFilter);
    }
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(tx => 
        tx.asset_id.toLowerCase().includes(query) ||
        tx.type.toLowerCase().includes(query) ||
        tx.status.toLowerCase().includes(query)
      );
    }
    
    setFilteredTransactions(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [transactions, typeFilter, searchQuery]);

  // Get current page transactions
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstTransaction, indexOfLastTransaction);
  
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  // Get icon for transaction type
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowUpIcon className="h-5 w-5 text-green-500" />;
      case 'withdraw':
        return <ArrowDownIcon className="h-5 w-5 text-red-500" />;
      case 'buy':
        return <ArrowDownIcon className="h-5 w-5 text-blue-500" />;
      case 'sell':
        return <ArrowUpIcon className="h-5 w-5 text-purple-500" />;
      default:
        return <CoinsIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Transaction History</h1>
      
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Filters & Search</CardTitle>
          <CardDescription>Narrow down your transaction history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search transactions..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Type filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="deposit">Deposits</SelectItem>
                <SelectItem value="withdraw">Withdrawals</SelectItem>
                <SelectItem value="buy">Purchases</SelectItem>
                <SelectItem value="sell">Sales</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Date sort */}
            <Select value={dateSort} onValueChange={(value) => setDateSort(value as 'asc' | 'desc')}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sort by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Newest First</SelectItem>
                <SelectItem value="asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {loading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-500">
              <p className="mb-2">Error loading transactions</p>
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <p>No transactions found</p>
              <p className="text-sm mt-2">
                {searchQuery || typeFilter !== 'all' 
                  ? "Try adjusting your filters" 
                  : "Your transaction history will appear here"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableCaption>
                  Showing {indexOfFirstTransaction + 1}-
                  {Math.min(indexOfLastTransaction, filteredTransactions.length)} of {filteredTransactions.length} transactions
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <div className="flex items-center">
                          {getTransactionIcon(tx.type)}
                          <span className="ml-2 capitalize">{tx.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>{tx.asset_id}</TableCell>
                      <TableCell className="text-right">
                        {tx.type === 'buy' || tx.type === 'sell' 
                          ? tx.amount.toLocaleString() 
                          : '$' + tx.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className={`text-right ${
                        tx.type === 'deposit' || tx.type === 'sell' 
                          ? 'text-green-500' 
                          : tx.type === 'withdraw' || tx.type === 'buy' 
                            ? 'text-red-500' 
                            : ''
                      }`}>
                        {tx.type === 'deposit' || tx.type === 'sell' ? '+' : 
                         tx.type === 'withdraw' || tx.type === 'buy' ? '-' : ''}
                        ${tx.total_value.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          tx.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : tx.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : tx.status === 'failed' 
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}>
                          {tx.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{formatDate(tx.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(curr => Math.max(curr - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(curr => Math.min(curr + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TransactionHistory;
