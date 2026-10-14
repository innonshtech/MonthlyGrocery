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

export type HomeProductCardProps = {
  item: Product;
  width: number;
  quantity: number;
  onPress: () => void;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
};

export default function HomeProductCard({
  item,
  width,
  quantity,
  onPress,
  onAdd,
  onIncrement,
  onDecrement,
}: HomeProductCardProps) {
  const price = parseFloat(String(item.price)) || 0;
  const mrp = parseFloat(String(item.mrp)) || price;
  const pctOff = getProductDiscountPercent(item);
  const packLabel = getProductPackLabel(item);
  const isOutOfStock =
    item.available === false ||
    (item as any).in_stock === false ||
    (item.stock !== undefined && item.stock !== null && Number(item.stock) <= 0);

  const imgHeight = Math.min(Math.max(Math.round(width * 0.72), 105), 130);

  return (
    <TouchableOpacity
      style={[styles.card, { width }, isOutOfStock && styles.cardOutOfStock]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {/* Product Image Area */}
      <View style={[styles.imgWrap, { height: imgHeight }]}>
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
            style={[styles.productImg, isOutOfStock && styles.imgOutOfStock]}
            resizeMode="contain"
          />
        ) : (
          <AppIcon name="shopping-bag" size={38} color={isOutOfStock ? '#94A3B8' : COLORS.green700} />
        )}
      </View>

      {/* Info Block */}
      <View style={styles.infoBlock}>
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

        {/* Price & Action Row */}
        <View style={styles.bottomRow}>
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
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={onDecrement}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                activeOpacity={0.7}
              >
                <Text style={styles.stepTxt}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepQty}>{quantity}</Text>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={onIncrement}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                activeOpacity={0.7}
              >
                <Text style={styles.stepTxt}>+</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addBtn} onPress={onAdd} activeOpacity={0.82}>
              <Text style={styles.addTxt}>ADD</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E8EDE9',
    padding: 8,
    paddingBottom: 10,
    flexDirection: 'column',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  cardOutOfStock: {
    opacity: 0.72,
  },
  imgWrap: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#F9FAF9',
    borderWidth: 1,
    borderColor: '#F0F3F1',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#334155',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
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
    top: 6,
    left: 6,
    backgroundColor: '#F59E0B',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 1,
  },
  offBadgeTxt: {
    ...FONTS.muktaBold,
    fontSize: 9,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  productImg: {
    width: '88%',
    height: '88%',
  },
  imgOutOfStock: {
    opacity: 0.45,
  },
  infoBlock: {
    marginTop: 8,
    flex: 1,
    justifyContent: 'space-between',
  },
  name: {
    ...FONTS.muktaBold,
    fontSize: 13.5,
    lineHeight: 18,
    color: '#1E293B',
    minHeight: 36,
  },
  nameOutOfStock: {
    color: '#94A3B8',
  },
  unitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
    marginBottom: 8,
    minHeight: 18,
  },
  unit: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    color: '#64748B',
  },
  optionsPill: {
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  optionsPillText: {
    ...FONTS.muktaSemiBold,
    fontSize: 10.5,
    color: '#475569',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  priceCol: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  price: {
    ...FONTS.muktaBold,
    fontSize: 15,
    lineHeight: 19,
    color: '#0F172A',
  },
  priceOutOfStock: {
    color: '#94A3B8',
  },
  mrp: {
    ...FONTS.muktaRegular,
    fontSize: 11.5,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    marginTop: -1,
  },
  outOfStockPill: {
    backgroundColor: '#F1F5F9',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  outOfStockPillTxt: {
    ...FONTS.muktaSemiBold,
    fontSize: 11,
    color: '#94A3B8',
  },
  addBtn: {
    backgroundColor: '#E8F5E9',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7D7B8',
    paddingHorizontal: 14,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTxt: {
    ...FONTS.muktaBold,
    fontSize: 12.5,
    color: '#156C3E',
    letterSpacing: 0.3,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#156C3E',
    borderRadius: 14,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 8,
  },
  stepBtn: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTxt: {
    ...FONTS.muktaBold,
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 17,
  },
  stepQty: {
    ...FONTS.muktaBold,
    fontSize: 12.5,
    color: '#FFFFFF',
    minWidth: 14,
    textAlign: 'center',
  },
});
