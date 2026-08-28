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
import { COLORS, FONTS, RADIUS } from '../../constants/theme';

/** Figma B1 Home deals rail — node 542:852 (150×227) */
export const HOME_DEAL_CARD_WIDTH = 150;
export const HOME_DEAL_CARD_HEIGHT = 227;
const INNER_PAD = 8;
const IMG_HEIGHT = 96;

type HomeDealCardProps = {
  item: Product;
  index: number;
  quantity: number;
  onPress: () => void;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
};

export default function HomeDealCard({
  item,
  index,
  quantity,
  onPress,
  onAdd,
  onIncrement,
  onDecrement,
}: HomeDealCardProps) {
  const price = parseFloat(String(item.price)) || 0;
  const mrp = parseFloat(String(item.mrp)) || price;
  const pctOff = getProductDiscountPercent(item);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.imgWrap, { backgroundColor: homeDealBg(index) }]}>
        {pctOff > 0 && (
          <View style={styles.offBadge}>
            <Text style={styles.offBadgeTxt}>{pctOff}% OFF</Text>
          </View>
        )}
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.productImg} resizeMode="contain" />
        ) : (
          <AppIcon name="shopping-bag" size={40} color={COLORS.green700} />
        )}
      </View>

      <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
      {item.unit ? <Text style={styles.unit}>{item.unit}</Text> : null}

      <View style={styles.priceRow}>
        <View style={styles.priceCol}>
          <Text style={styles.price}>₹{price}</Text>
          {mrp > price ? <Text style={styles.mrp}>₹{mrp}</Text> : null}
        </View>

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
          <TouchableOpacity style={styles.addBtn} onPress={onAdd} activeOpacity={0.85}>
            <Text style={styles.addTxt}>ADD</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: HOME_DEAL_CARD_WIDTH,
    height: HOME_DEAL_CARD_HEIGHT,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    padding: INNER_PAD,
    flexDirection: 'column',
  },
  imgWrap: {
    width: HOME_DEAL_CARD_WIDTH - INNER_PAD * 2,
    height: IMG_HEIGHT,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  offBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: COLORS.marigold500,
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 3,
    minHeight: 20,
    justifyContent: 'center',
    zIndex: 2,
  },
  offBadgeTxt: {
    ...FONTS.muktaBold,
    fontSize: 10,
    color: '#FFFFFF',
    lineHeight: 14,
  },
  productImg: {
    width: 60,
    height: 60,
  },
  name: {
    ...FONTS.balooSemiBold,
    fontSize: 13,
    color: COLORS.ink900,
    lineHeight: 16,
    height: 40,
    marginTop: 7,
  },
  unit: {
    ...FONTS.muktaBold,
    fontSize: 12,
    color: COLORS.ink500,
    lineHeight: 16,
    marginTop: 7,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 36,
    marginTop: 'auto',
  },
  priceCol: {
    height: 34,
    justifyContent: 'center',
  },
  price: {
    ...FONTS.balooBold,
    fontSize: 15,
    color: COLORS.ink900,
    lineHeight: 20,
  },
  mrp: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: COLORS.ink300,
    lineHeight: 14,
    textDecorationLine: 'line-through',
  },
  addBtn: {
    width: 57,
    height: 32,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.green700,
    borderRadius: RADIUS.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTxt: {
    ...FONTS.balooBold,
    fontSize: 12,
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
});
