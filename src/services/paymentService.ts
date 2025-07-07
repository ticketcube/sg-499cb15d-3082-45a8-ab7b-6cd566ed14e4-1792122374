
import { supabase } from "@/integrations/supabase/client";

export interface PaymentTransaction {
  id: string;
  user_id: string;
  amount: number;
  points_awarded: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  stripe_payment_intent_id?: string;
  stripe_customer_id?: string;
  created_at: string;
}

export interface PointsLedgerEntry {
  id: string;
  user_id: string;
  amount: number;
  type: 'PAID' | 'EARNED' | 'WON' | 'REDEEMED';
  description?: string;
  reference_id?: string;
  created_at: string;
}

export const paymentService = {
  async createPaymentIntent(amount: number) {
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: { amount }
    });
    
    if (error) throw error;
    return data;
  },

  async getPaymentTransactions() {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as PaymentTransaction[];
  },

  async getPointsLedger() {
    const { data, error } = await supabase
      .from('points_ledger')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as PointsLedgerEntry[];
  },

  async getUserPoints(userId: string) {
    const { data, error } = await supabase
      .from('points_ledger')
      .select('amount, type')
      .eq('user_id', userId);

    if (error) throw error;

    // Calculate totals for each type
    return data.reduce((acc, entry) => {
      switch (entry.type) {
        case 'PAID':
          acc.paidPoints += entry.amount;
          break;
        case 'EARNED':
          acc.earnedPoints += entry.amount;
          break;
        case 'WON':
          acc.wonPoints += entry.amount;
          break;
        case 'REDEEMED':
          acc.redeemedPoints += entry.amount;
          break;
      }
      return acc;
    }, {
      paidPoints: 0,
      earnedPoints: 0,
      wonPoints: 0,
      redeemedPoints: 0,
      totalPoints: function() {
        return this.paidPoints + this.earnedPoints + this.wonPoints - this.redeemedPoints;
      }
    });
  }
};

export default paymentService;
