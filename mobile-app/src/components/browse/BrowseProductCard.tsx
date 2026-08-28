import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Product } from '../../context/CartContext';
import AppIcon from '../AppIcon';
import { getProductDiscountPercent, homeDealBg } from '../../utils/productDiscount';
import { getProductPackLabel } from '../../utils/packUnit';
import { COLORS, FONTS } from '../../constants/theme';

/** Figma B4 product tile — shared by Home deals rail + category grid */
export const BROWSE_PRODUCT_CARD_WIDTH = 139;
export const BROWSE_PRODUCT_IMG_HEIGHT = 92;

type BrowseProductCardProps = {
  item: Product;
  index: number;
  quantity: number;
  width?: number;
  onPress: () => void;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  addButtonLabel?: string;
};

export default function BrowseProductCard({
  item,
  index,
  quantity,
  width = BROWSE_PRODUCT_CARD_WIDTH,
  onPress,
  onAdd,
  onIncrement,
  onDecrement,
  addButtonLabel = 'ADD',
}: BrowseProductCardProps) {
  const price = parseFloat(String(item.price)) || 0;
  const mrp = parseFloat(String(item.mrp)) || price;
  const pctOff = getProductDiscountPercent(item);
  const packLabel = getProductPackLabel(item);

  return (
    <TouchableOpacity
      style={[styles.card, { width }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.imgWrap, { backgroundColor: homeDealBg(index) }]}>
        {pctOff > 0 && (
          <View style={styles.offBadge}>
            <Text style={styles.offBadgeTxt}>{pctOff}% OFF</Text>
          </View>
        )}

        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.img} resizeMode="contain" />
        ) : (
          <AppIcon name="shopping-bag" size={36} color={COLORS.green700} />
        )}

        {quantity > 0 ? (
          <View style={styles.stepper}>
            <TouchableOpacity style={styles.stepBtn} onPress={onDecrement}>
              <Text style={styles.stepTxt}>−</Text>
            </TouchableOpacity>
            <Text style={styles.stepQty}>{quantity}</Text>
            <TouchableOpacity style={styles.stepBtn} onPress={onIncrement}>
              <Text style={styles.stepTxt}>+</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.addPill} onPress={onAdd} activeOpacity={0.85}>
            <Text style={styles.addPillTxt}>{addButtonLabel}</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
      {packLabel ? <Text style={styles.unit}>{packLabel}</Text> : null}

      <View style={styles.priceRow}>
        <Text style={styles.price}>₹{price}</Text>
        {mrp > price ? <Text style={styles.mrp}>₹{mrp}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 8,
    paddingBottom: 10,
    gap: 5,
  },
  imgWrap: {
    width: '100%',
    height: BROWSE_PRODUCT_IMG_HEIGHT,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  offBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: COLORS.marigold500,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    zIndex: 2,
  },
  offBadgeTxt: {
    ...FONTS.muktaBold,
    fontSize: 9,
    color: '#FFFFFF',
  },
  img: {
    width: 54,
    height: 54,
  },
  addPill: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.green700,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    zIndex: 3,
  },
  addPillTxt: {
    ...FONTS.muktaBold,
    fontSize: 13,
    color: COLORS.green700,
  },
  stepper: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green700,
    borderRadius: 8,
    height: 32,
    zIndex: 3,
  },
  stepBtn: {
    width: 28,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTxt: {
    ...FONTS.muktaBold,
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  stepQty: {
    ...FONTS.muktaBold,
    fontSize: 13,
    color: '#FFFFFF',
    minWidth: 16,
    textAlign: 'center',
  },
  name: {
    ...FONTS.muktaMedium,
    fontSize: 14,
    color: COLORS.ink900,
    lineHeight: 20,
    minHeight: 40,
  },
  unit: {
    ...FONTS.muktaBold,
    fontSize: 11,
    color: COLORS.ink500,
    lineHeight: 14,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  price: {
    ...FONTS.muktaMedium,
    fontSize: 14,
    color: COLORS.ink900,
  },
  mrp: {
    ...FONTS.muktaRegular,
    fontSize: 11,
    color: COLORS.ink300,
    textDecorationLine: 'line-through',
  },
});
