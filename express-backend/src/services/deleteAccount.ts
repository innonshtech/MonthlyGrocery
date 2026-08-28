import { supabase } from '../config/supabase';
import { readDb, writeDb } from '../config/localDb';

export interface DeleteAccountResult {
  success: boolean;
  error?: string;
}

export async function deleteConsumerAccount(consumerId: string): Promise<DeleteAccountResult> {
  try {
    const db = readDb() as any;

    if (db.user_addresses) {
      db.user_addresses = db.user_addresses.filter(
        (address: { consumer_id?: string }) => address.consumer_id !== consumerId,
      );
    }

    if (db.orders?.length) {
      db.orders = db.orders.map((order: any) => {
        if (order.consumer_id !== consumerId) return order;
        return {
          ...order,
          account_deleted: true,
        };
      });
    }

    writeDb(db);

    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', consumerId);

    if (profileError) {
      console.error('Failed to delete profile row:', profileError.message);
    }

    const { error: authError } = await supabase.auth.admin.deleteUser(consumerId);
    if (authError) {
      return {
        success: false,
        error: authError.message || 'Failed to delete account',
      };
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to delete account',
    };
  }
}
