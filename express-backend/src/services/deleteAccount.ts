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

    const anonymizedPhone = `deleted-${consumerId.replace(/-/g, '').slice(0, 12)}-${Date.now()}`;

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        name: 'Deleted User',
        phone: anonymizedPhone,
        email: null,
        avatar_url: null,
        status: 'deleted',
      })
      .eq('id', consumerId);

    if (profileError) {
      console.error('Failed to anonymize profile:', profileError.message);
      return {
        success: false,
        error: profileError.message || 'Failed to delete account',
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
