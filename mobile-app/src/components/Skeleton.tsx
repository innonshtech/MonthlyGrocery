import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Animated,
  Easing,
  ViewStyle,
  DimensionValue,
} from 'react-native';

/**
 * Reusable animated pulse hook (60fps native driver).
 * Simulates a glowing shimmer wave across skeleton placeholders.
 */
export function useSkeletonPulse() {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return pulseAnim;
}

interface SkeletonBoxProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
  opacity?: Animated.Value;
}

/** Single pulsating skeleton placeholder box */
export function SkeletonBox({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
  opacity,
}: SkeletonBoxProps) {
  const defaultOpacity = useSkeletonPulse();
  const activeOpacity = opacity ?? defaultOpacity;

  return (
    <Animated.View
      style={[
        styles.baseBox,
        {
          width,
          height,
          borderRadius,
          opacity: activeOpacity,
        },
        style,
      ]}
    />
  );
}

interface SkeletonLineProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  opacity?: Animated.Value;
}

/** Single pulsating skeleton line for text titles, prices, descriptions */
export function SkeletonLine({
  width = '100%',
  height = 11,
  borderRadius = 6,
  style,
  opacity,
}: SkeletonLineProps) {
  return (
    <SkeletonBox
      width={width}
      height={height}
      borderRadius={borderRadius}
      style={style}
      opacity={opacity}
    />
  );
}

/** Horizontal category rail placeholder for HomeScreen */
export function CategoryRailSkeleton({ count = 6 }: { count?: number }) {
  const pulse = useSkeletonPulse();
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.catRailScroll}
    >
      {items.map((i) => (
        <View key={i} style={styles.catRailItem}>
          <SkeletonBox
            width={72}
            height={72}
            borderRadius={16}
            opacity={pulse}
            style={styles.catTileBox}
          />
          <SkeletonLine width={54} height={9} style={{ marginTop: 7 }} opacity={pulse} />
          <SkeletonLine width={38} height={8} style={{ marginTop: 4 }} opacity={pulse} />
        </View>
      ))}
    </ScrollView>
  );
}

/** Grid category tile placeholders for CategoriesScreen */
export function CategoryGridSkeleton({ count = 9 }: { count?: number }) {
  const pulse = useSkeletonPulse();
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <View style={styles.catGridContainer}>
      {items.map((i) => (
        <View key={i} style={styles.catGridItem}>
          <SkeletonBox
            width={82}
            height={82}
            borderRadius={18}
            opacity={pulse}
            style={styles.catGridTile}
          />
          <SkeletonLine width={64} height={10} style={{ marginTop: 8 }} opacity={pulse} />
          <SkeletonLine width={44} height={8} style={{ marginTop: 4 }} opacity={pulse} />
        </View>
      ))}
    </View>
  );
}

/** Horizontal product deals cards placeholder for HomeScreen */
export function ProductRailSkeleton({ count = 3 }: { count?: number }) {
  const pulse = useSkeletonPulse();
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.dealRailScroll}
    >
      {items.map((i) => (
        <View key={i} style={styles.dealCard}>
          {/* Product Image Box */}
          <SkeletonBox
            width="100%"
            height={98}
            borderRadius={12}
            opacity={pulse}
          />
          {/* Weight / Pack tag line */}
          <SkeletonLine width={48} height={9} style={{ marginTop: 8 }} opacity={pulse} />
          {/* Product Title lines */}
          <SkeletonLine width="92%" height={12} style={{ marginTop: 6 }} opacity={pulse} />
          <SkeletonLine width="68%" height={11} style={{ marginTop: 4 }} opacity={pulse} />
          {/* Price & Add button row */}
          <View style={styles.dealCardFooter}>
            <View>
              <SkeletonLine width={46} height={14} opacity={pulse} />
              <SkeletonLine width={32} height={9} style={{ marginTop: 3 }} opacity={pulse} />
            </View>
            <SkeletonBox width={56} height={28} borderRadius={14} opacity={pulse} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

/** 2-column product grid placeholder for CategoryProductsScreen / SearchScreen */
export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  const pulse = useSkeletonPulse();
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <View style={styles.productGrid}>
      {items.map((i) => (
        <View key={i} style={styles.gridCard}>
          <SkeletonBox width="100%" height={110} borderRadius={12} opacity={pulse} />
          <SkeletonLine width={50} height={9} style={{ marginTop: 8 }} opacity={pulse} />
          <SkeletonLine width="90%" height={12} style={{ marginTop: 6 }} opacity={pulse} />
          <SkeletonLine width="65%" height={10} style={{ marginTop: 4 }} opacity={pulse} />
          <View style={styles.gridCardFooter}>
            <SkeletonLine width={44} height={14} opacity={pulse} />
            <SkeletonBox width={52} height={26} borderRadius={13} opacity={pulse} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Generic vertical card list skeleton (used by AppLoader and list screens) */
export function CardListSkeleton({ count = 3 }: { count?: number }) {
  const pulse = useSkeletonPulse();
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <View style={styles.cardListContainer}>
      {items.map((i) => (
        <View key={i} style={styles.listCard}>
          <SkeletonBox width={64} height={64} borderRadius={14} opacity={pulse} />
          <View style={styles.listCardCol}>
            <SkeletonLine width="80%" height={13} opacity={pulse} />
            <SkeletonLine width="55%" height={10} style={{ marginTop: 8 }} opacity={pulse} />
            <SkeletonLine width="35%" height={10} style={{ marginTop: 6 }} opacity={pulse} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Full-screen cart page skeleton */
export function CartSkeleton() {
  const pulse = useSkeletonPulse();

  return (
    <View style={styles.cartSkeletonWrap}>
      {/* Top delivery estimate card */}
      <View style={styles.cartHeaderCard}>
        <SkeletonLine width="40%" height={12} opacity={pulse} />
        <SkeletonLine width="75%" height={16} style={{ marginTop: 8 }} opacity={pulse} />
      </View>

      {/* Cart items */}
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.cartItemCard}>
          <SkeletonBox width={72} height={72} borderRadius={12} opacity={pulse} />
          <View style={styles.cartItemText}>
            <SkeletonLine width="90%" height={13} opacity={pulse} />
            <SkeletonLine width="50%" height={10} style={{ marginTop: 6 }} opacity={pulse} />
            <View style={styles.cartItemPriceRow}>
              <SkeletonLine width={50} height={15} opacity={pulse} />
              <SkeletonBox width={76} height={28} borderRadius={14} opacity={pulse} />
            </View>
          </View>
        </View>
      ))}

      {/* Bill summary card */}
      <View style={styles.cartBillCard}>
        <SkeletonLine width="50%" height={14} opacity={pulse} />
        <View style={{ marginTop: 12, gap: 8 }}>
          <SkeletonLine width="100%" height={10} opacity={pulse} />
          <SkeletonLine width="100%" height={10} opacity={pulse} />
          <SkeletonLine width="100%" height={12} opacity={pulse} />
        </View>
      </View>
    </View>
  );
}

/** Orders list page skeleton */
export function OrderListSkeleton({ count = 3 }: { count?: number }) {
  const pulse = useSkeletonPulse();
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <View style={styles.orderListWrap}>
      {items.map((i) => (
        <View key={i} style={styles.orderCard}>
          <View style={styles.orderCardHeader}>
            <SkeletonLine width={110} height={13} opacity={pulse} />
            <SkeletonBox width={64} height={22} borderRadius={11} opacity={pulse} />
          </View>
          <SkeletonLine width={160} height={10} style={{ marginTop: 6 }} opacity={pulse} />
          <View style={styles.orderThumbsRow}>
            {[0, 1, 2].map((t) => (
              <SkeletonBox key={t} width={42} height={42} borderRadius={21} opacity={pulse} style={{ marginRight: 8 }} />
            ))}
          </View>
          <View style={styles.orderCardFooter}>
            <SkeletonLine width={70} height={15} opacity={pulse} />
            <SkeletonBox width={80} height={30} borderRadius={15} opacity={pulse} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  baseBox: {
    backgroundColor: '#E2E8E5',
  },
  catRailScroll: {
    gap: 12,
    paddingBottom: 4,
    marginBottom: 20,
  },
  catRailItem: {
    width: 72,
    alignItems: 'center',
  },
  catTileBox: {
    backgroundColor: '#E8ECE9',
  },
  catGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 14,
  },
  catGridItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 16,
  },
  catGridTile: {
    backgroundColor: '#E8ECE9',
  },
  dealRailScroll: {
    gap: 12,
    paddingBottom: 4,
    marginBottom: 18,
  },
  dealCard: {
    width: 150,
    height: 227,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EDF1EE',
    padding: 8,
  },
  dealCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 'auto',
    paddingTop: 8,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 10,
  },
  gridCard: {
    width: '48%',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EDF1EE',
    padding: 10,
    marginBottom: 10,
  },
  gridCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  cardListContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    width: '100%',
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#EDF1EE',
  },
  listCardCol: {
    flex: 1,
    marginLeft: 14,
  },
  cartSkeletonWrap: {
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  cartHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#EDF1EE',
  },
  cartItemCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#EDF1EE',
  },
  cartItemText: {
    flex: 1,
    marginLeft: 12,
  },
  cartItemPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  cartBillCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: '#EDF1EE',
  },
  orderListWrap: {
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#EDF1EE',
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderThumbsRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F3F1',
  },
});
