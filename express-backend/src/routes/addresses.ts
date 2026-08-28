import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { readDb, writeDb } from '../config/localDb';

const router = Router();

export interface UserAddressRecord {
  id: string;
  consumer_id: string;
  tag: string;
  flat: string;
  street: string;
  landmark?: string;
  pincode: string;
  phone: string;
  isDefault?: boolean;
  created_at?: string;
  updated_at?: string;
}

// GET / — List saved addresses for logged-in consumer
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = readDb() as any;
    const addresses: UserAddressRecord[] = (db.user_addresses || []).filter(
      (a: UserAddressRecord) => a.consumer_id === req.user!.id,
    );
    return res.json({ success: true, addresses });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to load addresses' });
  }
});

// POST / — Create or update an address
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id, tag, flat, street, landmark, pincode, phone, isDefault } = req.body;

  if (!flat?.trim() || !street?.trim() || !pincode?.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Flat/house, area/locality, and pincode are required',
    });
  }

  try {
    const db = readDb() as any;
    if (!db.user_addresses) db.user_addresses = [];

    const consumerId = req.user!.id;
    const now = new Date().toISOString();
    let saved: UserAddressRecord;

    if (id) {
      const idx = db.user_addresses.findIndex(
        (a: UserAddressRecord) => a.id === id && a.consumer_id === consumerId,
      );
      if (idx === -1) {
        return res.status(404).json({ success: false, error: 'Address not found' });
      }
      saved = {
        ...db.user_addresses[idx],
        tag: (tag || 'Home').trim(),
        flat: flat.trim(),
        street: street.trim(),
        landmark: landmark?.trim() || '',
        pincode: pincode.trim(),
        phone: (phone || '').trim(),
        isDefault: isDefault === true,
        updated_at: now,
      };
      db.user_addresses[idx] = saved;
    } else {
      saved = {
        id: `addr-${Date.now()}`,
        consumer_id: consumerId,
        tag: (tag || 'Home').trim(),
        flat: flat.trim(),
        street: street.trim(),
        landmark: landmark?.trim() || '',
        pincode: pincode.trim(),
        phone: (phone || '').trim(),
        isDefault: isDefault === true || db.user_addresses.filter(
          (a: UserAddressRecord) => a.consumer_id === consumerId,
        ).length === 0,
        created_at: now,
        updated_at: now,
      };
      db.user_addresses.push(saved);
    }

    if (saved.isDefault) {
      db.user_addresses = db.user_addresses.map((a: UserAddressRecord) => {
        if (a.consumer_id !== consumerId) return a;
        return { ...a, isDefault: a.id === saved.id };
      });
    }

    writeDb(db);
    const addresses = db.user_addresses.filter(
      (a: UserAddressRecord) => a.consumer_id === consumerId,
    );
    return res.json({ success: true, address: saved, addresses });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to save address' });
  }
});

// DELETE /:id — Remove an address
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const db = readDb() as any;
    const consumerId = req.user!.id;
    const exists = (db.user_addresses || []).some(
      (a: UserAddressRecord) => a.id === id && a.consumer_id === consumerId,
    );
    if (!exists) {
      return res.status(404).json({ success: false, error: 'Address not found' });
    }

    db.user_addresses = (db.user_addresses || []).filter(
      (a: UserAddressRecord) => a.id !== id || a.consumer_id !== consumerId,
    );

    const remaining = db.user_addresses.filter(
      (a: UserAddressRecord) => a.consumer_id === consumerId,
    );
    if (remaining.length > 0 && !remaining.some((a: UserAddressRecord) => a.isDefault)) {
      remaining[0].isDefault = true;
    }

    writeDb(db);
    return res.json({ success: true, addresses: remaining });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to delete address' });
  }
});

export default router;
