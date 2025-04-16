import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { GiftIcon } from 'lucide-react';
import { LoaderCircle } from 'lucide-react';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const ref = queryParams.get('ref');
    
    if (ref) {
      setReferralCode(ref);
      setIsLogin(false);
      
      toast({
        title: "Referral Detected",
        description: "Sign up to receive your referral bonus!",
      });
    }
  }, [location.search, toast]);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const validatePassword = (password: string) => {
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    return re.test(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAuthError(null);
    
    if (!validateEmail(email)) {
      setAuthError('Please enter a valid email address');
      setIsSubmitting(false);
      return;
    }

    if (!isLogin && !validatePassword(password)) {
      setAuthError('Password must be at least 8 characters long, contain uppercase, lowercase, and a number');
      setIsSubmitting(false);
      return;
    }
    
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        if (!username || !fullName || !phoneNumber || !district) {
          setAuthError('All fields are required');
          setIsSubmitting(false);
          return;
        }

        if (!phoneNumber.match(/^\+252[1-9][0-9]{8}$/)) {
          setAuthError('Please enter a valid Somalia phone number (+252XXXXXXXXX)');
          setIsSubmitting(false);
          return;
        }

        const userData = {
          username,
          full_name: fullName,
          phone_number: phoneNumber,
          district
        };

        if (referralCode) {
          Object.assign(userData, { referred_by: referralCode });
        }

        await signUp(email, password, userData);
        
        if (referralCode) {
          setTimeout(async () => {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session?.user) {
              const { data: referralData } = await supabase
                .from('referrals')
                .select('user_id')
                .eq('code', referralCode)
                .maybeSingle();
                
              if (referralData) {
                await supabase.from('referrals_used').insert({
                  referrer_id: referralData.user_id,
                  referred_id: session.user.id,
                  referral_code: referralCode
                });
                
                await supabase
                  .from('profiles')
                  .update({ balance: 5 })
                  .eq('id', session.user.id);
              }
            }
          }, 2000);
        }
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      setAuthError(error.message || "Authentication failed. Please try again.");
    } finally {
      setIsSubmitting(false);
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

        {authError && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-md text-red-700">
            {authError}
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
              disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Select value={district} onValueChange={setDistrict} disabled={isSubmitting}>
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
              disabled={isSubmitting}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </>
            ) : (
              isLogin ? 'Sign In' : 'Sign Up'
            )}
          </Button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline"
            disabled={isSubmitting}
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
