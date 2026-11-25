export interface PiggyBank {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  target_amount: number;
  current_amount: number;
  deadline: string; // YYYY-MM-DD
  seed_color: string;
  icon: string;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
}

export interface Transaction {
  id: string;
  piggy_bank_id: string;
  user_id: string;
  amount: number;
  type: 'deposit' | 'withdraw';
  note?: string | null;
  created_at: string;
}
