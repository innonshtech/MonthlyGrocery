import { query } from '../config/db';
import { readDb, writeDb } from '../config/localDb';

export interface DeleteAccountResult {
  success: boolean;
  error?: string;
}

export async function deleteConsumerAccount(consumerId: string): Promise<DeleteAccountResult> {
  try {
    // 1. Fetch user phone/mobile to ensure all matching profile rows are wiped
    const { rows: existingProfiles } = await query(
      `SELECT id, phone, mobile FROM profiles WHERE id = $1`,
      [consumerId]
    );

    const userPhone = existingProfiles[0]?.phone || '';
    const userMobile = existingProfiles[0]?.mobile || '';

    // Anonymize all profile records associated with this ID or phone number
    if (userPhone || userMobile) {
      await query(
        `UPDATE profiles
         SET name = 'Deleted User',
             full_name = 'Deleted User',
             mobile = 'del_' || SUBSTRING(REPLACE(id, '-', ''), 1, 10) || '_' || EXTRACT(EPOCH FROM NOW())::bigint,
             phone = 'del_' || SUBSTRING(REPLACE(id, '-', ''), 1, 10) || '_' || EXTRACT(EPOCH FROM NOW())::bigint,
             email = NULL,
             avatar_url = NULL,
             status = 'deleted',
             updated_at = NOW()
         WHERE id = $1 OR phone = $2 OR mobile = $2 OR phone = $3 OR mobile = $3`,
        [consumerId, userPhone || 'nonexistent', userMobile || 'nonexistent']
      );
    } else {
      const anonymizedPhone = `del_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      await query(
        `UPDATE profiles
         SET name = 'Deleted User',
             full_name = 'Deleted User',
             mobile = $1,
             phone = $1,
             email = NULL,
             avatar_url = NULL,
             status = 'deleted',
             updated_at = NOW()
         WHERE id = $2`,
        [anonymizedPhone, consumerId]
      );
    }

    // 2. Delete all saved delivery addresses for this user
    await query(
      `DELETE FROM addresses
       WHERE user_id = $1 OR consumer_id = $1`,
      [consumerId]
    );

    // 3. Anonymize user details on past orders
    await query(
      `UPDATE orders
       SET customer_name = 'Deleted User',
           customer_phone = '0000000000',
           updated_at = NOW()
       WHERE user_id = $1 OR consumer_id = $1`,
      [consumerId]
    );

    // 4. Clean up localDb fallback if present
    try {
      const db = readDb() as any;
      if (db.user_addresses) {
        db.user_addresses = db.user_addresses.filter(
          (address: { consumer_id?: string; user_id?: string }) =>
            address.consumer_id !== consumerId && address.user_id !== consumerId
        );
      }
      if (db.orders?.length) {
        db.orders = db.orders.map((order: any) => {
          if (order.consumer_id !== consumerId && order.user_id !== consumerId) return order;
          return {
            ...order,
            account_deleted: true,
          };
        });
      }
      writeDb(db);
    } catch (e) {
      // ignore localDb errors
    }

    return { success: true };
  } catch (error: any) {
    console.error('[deleteConsumerAccount] Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete account',
    };
  }
}

