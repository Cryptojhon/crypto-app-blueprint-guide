
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2Icon, TrophyIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface MembershipLevel {
  id: number;
  name: string;
  cost: number;
  payments_count: number;
  total_value: number;
}

export const MembershipLevels = () => {
  const [levels, setLevels] = useState<MembershipLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLevel, setUserLevel] = useState<number | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchMembershipLevels = async () => {
      try {
        const { data: levels, error } = await supabase
          .from('membership_levels')
          .select('*')
          .order('cost');

        if (error) throw error;
        setLevels(levels || []);

        if (user) {
          const { data: userMembership } = await supabase
            .from('user_memberships')
            .select('level_id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (userMembership) {
            setUserLevel(userMembership.level_id);
          }
        }
      } catch (error) {
        console.error('Error fetching membership levels:', error);
        toast({
          title: "Error",
          description: "Failed to load membership levels",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMembershipLevels();
  }, [user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2Icon className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrophyIcon className="h-5 w-5 text-primary" />
          Membership Levels
        </CardTitle>
        <CardDescription>Choose your membership package</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {levels.map((level) => (
            <Card key={level.id} className={`
              relative overflow-hidden
              ${userLevel === level.id ? 'border-primary' : ''}
            `}>
              {userLevel === level.id && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-2 py-1 text-xs">
                  Current Level
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg">{level.name}</CardTitle>
                <CardDescription>Investment Package</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(level.cost)}
                </p>
                <div className="space-y-1 text-sm">
                  <p>You will receive {level.payments_count} payments</p>
                  <p className="font-medium">Total value: {formatCurrency(level.total_value)}</p>
                </div>
                <Button 
                  className="w-full mt-4" 
                  disabled={userLevel === level.id}
                >
                  {userLevel === level.id ? 'Current Package' : 'Select Package'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
