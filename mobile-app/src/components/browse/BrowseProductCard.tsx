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
import { getProductDiscountPercent } from '../../utils/productDiscount';
import { getProductPackLabel } from '../../utils/packUnit';
import { COLORS, FONTS, RADIUS } from '../../constants/theme';

/** Figma B4 product tile — shared by Home deals rail + category grid */
export const BROWSE_PRODUCT_CARD_WIDTH = 139;
export const BROWSE_PRODUCT_IMG_HEIGHT = 96;

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
  const isOutOfStock =
    item.available === false ||
    (item as any).in_stock === false ||
    (item.stock !== undefined && item.stock !== null && Number(item.stock) <= 0);

  return (
    <TouchableOpacity
      style={[styles.card, { width }, isOutOfStock && styles.cardOutOfStock]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.imgWrap}>
        {isOutOfStock ? (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockBadgeTxt}>OUT OF STOCK</Text>
          </View>
        ) : pctOff > 0 ? (
          <View style={styles.offBadge}>
            <Text style={styles.offBadgeTxt}>{pctOff}% OFF</Text>
          </View>
        ) : null}

        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={[styles.img, isOutOfStock && styles.imgOutOfStock]}
            resizeMode="contain"
          />
        ) : (
          <AppIcon name="shopping-bag" size={36} color={isOutOfStock ? '#94A3B8' : COLORS.green700} />
        )}
      </View>

      <Text style={[styles.name, isOutOfStock && styles.nameOutOfStock]} numberOfLines={2}>
        {item.name}
      </Text>
      <View style={styles.unitRow}>
        {packLabel ? <Text style={styles.unit}>{packLabel}</Text> : null}
        {Array.isArray((item as any).variants) && (item as any).variants.length > 1 ? (
          <View style={styles.optionsPill}>
            <Text style={styles.optionsPillText}>{(item as any).variants.length} sizes</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.priceRow}>
        <View style={styles.priceCol}>
          <Text style={[styles.price, isOutOfStock && styles.priceOutOfStock]}>₹{price}</Text>
          {mrp > price ? <Text style={styles.mrp}>₹{mrp}</Text> : null}
        </View>

        {isOutOfStock ? (
          <View style={styles.outOfStockPill}>
            <Text style={styles.outOfStockPillTxt}>Out of stock</Text>
          </View>
        ) : quantity > 0 ? (
          <View style={styles.stepper}>
            <TouchableOpacity style={styles.stepBtn} onPress={onDecrement} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
              <Text style={styles.stepTxt}>−</Text>
            </TouchableOpacity>
            <Text style={styles.stepQty}>{quantity}</Text>
            <TouchableOpacity style={styles.stepBtn} onPress={onIncrement} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
              <Text style={styles.stepTxt}>+</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.addBtn} onPress={onAdd} activeOpacity={0.85}>
            <Text style={styles.addTxt}>{addButtonLabel || 'ADD'}</Text>
          </TouchableOpacity>
        )}
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
    gap: 4,
  },
  cardOutOfStock: {
    opacity: 0.72,
  },
  imgWrap: {
    width: '100%',
    height: BROWSE_PRODUCT_IMG_HEIGHT,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: '#334155',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 2,
  },
  outOfStockBadgeTxt: {
    ...FONTS.muktaBold,
    fontSize: 8.5,
    color: '#FFFFFF',
    letterSpacing: 0.4,
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
    width: '90%',
    height: '90%',
  },
  imgOutOfStock: {
    opacity: 0.4,
  },
  name: {
    ...FONTS.muktaMedium,
    fontSize: 14,
    color: COLORS.ink900,
    lineHeight: 19,
    minHeight: 38,
    marginTop: 2,
  },
  nameOutOfStock: {
    color: COLORS.ink500,
  },
  unitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 18,
  },
  unit: {
    ...FONTS.muktaMedium,
    fontSize: 11.5,
    color: COLORS.ink500,
    lineHeight: 15,
  },
  optionsPill: {
    backgroundColor: COLORS.green50,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.8,
    borderColor: COLORS.green100,
  },
  optionsPillText: {
    ...FONTS.muktaSemiBold,
    fontSize: 9.5,
    color: COLORS.green700,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 34,
    marginTop: 2,
  },
  priceCol: {
    justifyContent: 'center',
    flexShrink: 1,
  },
  price: {
    ...FONTS.muktaMedium,
    fontSize: 14,
    color: COLORS.ink900,
    lineHeight: 18,
  },
  priceOutOfStock: {
    color: COLORS.ink500,
  },
  mrp: {
    ...FONTS.muktaRegular,
    fontSize: 11,
    color: COLORS.ink300,
    lineHeight: 14,
    textDecorationLine: 'line-through',
  },
  addBtn: {
    paddingHorizontal: 16,
    height: 32,
    backgroundColor: COLORS.green100,
    borderRadius: RADIUS.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTxt: {
    ...FONTS.muktaSemiBold,
    fontSize: 13,
    color: COLORS.green700,
    lineHeight: 16,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green700,
    borderRadius: RADIUS.pill,
    minWidth: 57,
    height: 32,
    paddingHorizontal: 4,
  },
  stepBtn: {
    width: 24,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTxt: {
    ...FONTS.balooBold,
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  stepQty: {
    ...FONTS.balooBold,
    fontSize: 12,
    color: '#FFFFFF',
    minWidth: 16,
    textAlign: 'center',
  },
  outOfStockPill: {
    paddingHorizontal: 8,
    height: 28,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: RADIUS.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockPillTxt: {
    ...FONTS.muktaBold,
    fontSize: 10,
    color: '#64748B',
  },
});
