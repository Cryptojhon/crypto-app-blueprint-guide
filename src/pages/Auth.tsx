
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const SOMALIA_DISTRICTS = [
  'Banaadir', 'Bari', 'Bay', 'Galguduud', 'Gedo', 'Hiiraan', 
  'Jubbada Dhexe', 'Jubbada Hoose', 'Mudug', 'Nugaal', 
  'Sanaag', 'Shabeellaha Dhexe', 'Shabeellaha Hoose', 
  'Sool', 'Togdheer', 'Woqooyi Galbeed'
];

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [district, setDistrict] = useState('');
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Extract referral code from URL
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const ref = queryParams.get('ref');
    
    if (ref) {
      setReferralCode(ref);
      // Switch to sign up mode if coming from a referral link
      setIsLogin(false);
      
      toast({
        title: "Referral Detected",
        description: "Sign up to receive your referral bonus!",
      });
    }
  }, [location.search, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        if (!username || !fullName || !phoneNumber || !district) {
          toast({
            title: "Error",
            description: "All fields are required",
            variant: "destructive",
          });
          return;
        }

        // Validate Somalia phone number format
        if (!phoneNumber.match(/^\+252[1-9][0-9]{8}$/)) {
          toast({
            title: "Error",
            description: "Please enter a valid Somalia phone number (+252XXXXXXXXX)",
            variant: "destructive",
          });
          return;
        }

        const userData = {
          username,
          full_name: fullName,
          phone_number: phoneNumber,
          district
        };

        // If a referral code was provided, include it in user metadata
        if (referralCode) {
          Object.assign(userData, { referred_by: referralCode });
        }

        await signUp(email, password, userData);
        
        // If referral code exists, record the referral usage
        if (referralCode) {
          // This creates a deferred function that will run after signup is completed
          // We can't use await here since we need this to run after the session is established
          setTimeout(async () => {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session?.user) {
              const { data: referral } = await supabase
                .from('referrals')
                .select('user_id')
                .eq('code', referralCode)
                .single();
                
              if (referral) {
                // Record the referral usage
                await supabase.from('referrals_used').insert({
                  referrer_id: referral.user_id,
                  referred_id: session.user.id,
                  referral_code: referralCode
                });
                
                // Award the signup bonus to the new user (as a balance increase)
                await supabase
                  .from('profiles')
                  .update({ balance: 5 }) // $5 signup bonus
                  .eq('id', session.user.id);
              }
            }
          }, 2000);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </h1>
        </div>

        {referralCode && !isLogin && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-md flex items-start gap-3">
            <div className="bg-green-100 p-1.5 rounded-full">
              <GiftIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-800">Referral Bonus!</p>
              <p className="text-sm text-green-700">
                You'll receive $5 when you sign up with this referral.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {!isLogin && (
            <>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+252XXXXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Select value={district} onValueChange={setDistrict} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your district" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOMALIA_DISTRICTS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full">
            {isLogin ? 'Sign In' : 'Sign Up'}
          </Button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Import GiftIcon for the referral notification
const GiftIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="20 12 20 22 4 22 4 12"></polyline>
    <rect x="2" y="7" width="20" height="5"></rect>
    <line x1="12" y1="22" x2="12" y2="7"></line>
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
  </svg>
);

export default Auth;
