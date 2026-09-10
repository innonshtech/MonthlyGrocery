import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  Dimensions,
} from 'react-native';
import SafeProductImage from './SafeProductImage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface ProductMediaItem {
  name: string;
  sku?: string;
  unit?: string;
  primary_category?: string;
  images?: string[];
  image_url?: string;
  video_url?: string | null;
  selling_price?: number;
  mrp?: number;
}

interface ProductMediaModalProps {
  visible: boolean;
  onClose: () => void;
  product: ProductMediaItem | null;
}

export default function ProductMediaModal({
  visible,
  onClose,
  product,
}: ProductMediaModalProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (visible) {
      setSelectedIndex(0);
    }
  }, [visible, product]);

  if (!product) return null;

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : (product.image_url ? [product.image_url] : []);

  const activeImageUri = images[selectedIndex] || product.image_url || '';

  const handleOpenVideo = () => {
    if (!product.video_url) return;
    Linking.openURL(product.video_url).catch(() => {
      Alert.alert('Error', 'Unable to open the product video link on this device.');
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>
                {product.name}
              </Text>
              <Text style={styles.subTitle}>
                {product.unit ? `${product.unit} · ` : ''}
                {product.sku ? `SKU: ${product.sku}` : (product.primary_category || 'Product Media')}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Main Photo Preview */}
          <View style={styles.mainPreviewContainer}>
            <SafeProductImage
              uri={activeImageUri}
              style={styles.mainPreviewImage}
              resizeMode="contain"
            />
            {images.length > 1 && (
              <View style={styles.pageBadge}>
                <Text style={styles.pageBadgeText}>
                  Angle {selectedIndex + 1} of {images.length}
                </Text>
              </View>
            )}
          </View>

          {/* Multi-angle Thumbnail Strip */}
          {images.length > 1 ? (
            <View style={styles.thumbStripWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbStrip}
              >
                {images.map((imgUri, idx) => {
                  const isSelected = selectedIndex === idx;
                  const isSvg = imgUri.toLowerCase().endsWith('.svg') || imgUri.includes('.svg?');
                  const isPng = imgUri.toLowerCase().endsWith('.png') || imgUri.includes('.png?');

                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.thumbChip, isSelected && styles.thumbChipSelected]}
                      onPress={() => setSelectedIndex(idx)}
                      activeOpacity={0.8}
                    >
                      <SafeProductImage
                        uri={imgUri}
                        style={styles.thumbImage}
                        resizeMode="contain"
                      />
                      <View style={[styles.thumbTag, isSelected && styles.thumbTagSelected]}>
                        <Text style={[styles.thumbTagText, isSelected && styles.thumbTagTextSelected]}>
                          {isPng ? 'PNG' : isSvg ? 'SVG' : `#${idx + 1}`}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          {/* Video Demo Action */}
          {product.video_url ? (
            <TouchableOpacity style={styles.videoBtn} onPress={handleOpenVideo}>
              <Text style={styles.videoBtnText}>▶️ Watch Product Demo Video</Text>
            </TouchableOpacity>
          ) : null}

          {/* Price & MRP Row */}
          {(product.selling_price !== undefined || product.mrp !== undefined) && (
            <View style={styles.infoFooter}>
              {product.selling_price !== undefined && (
                <Text style={styles.priceText}>
                  Selling: <Text style={styles.boldText}>₹{product.selling_price}</Text>
                </Text>
              )}
              {product.mrp !== undefined && (
                <Text style={styles.mrpText}>
                  MRP: <Text style={styles.boldText}>₹{product.mrp}</Text>
                </Text>
              )}
              {images.length > 1 && (
                <Text style={styles.anglesInfo}>📷 {images.length} photo angles</Text>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: Math.min(SCREEN_WIDTH - 32, 400),
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  subTitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  closeBtnText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: 'bold',
  },
  mainPreviewContainer: {
    width: '100%',
    height: 220,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  mainPreviewImage: {
    width: '90%',
    height: '90%',
  },
  pageBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  pageBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  thumbStripWrapper: {
    marginTop: 12,
  },
  thumbStrip: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 2,
  },
  thumbChip: {
    width: 58,
    height: 58,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 3,
    position: 'relative',
  },
  thumbChipSelected: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbTag: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  thumbTagSelected: {
    backgroundColor: '#22C55E',
  },
  thumbTagText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#64748B',
  },
  thumbTagTextSelected: {
    color: '#FFFFFF',
  },
  videoBtn: {
    marginTop: 12,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoBtnText: {
    color: '#16A34A',
    fontWeight: 'bold',
    fontSize: 13,
  },
  infoFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 13,
    color: '#334155',
  },
  mrpText: {
    fontSize: 13,
    color: '#64748B',
  },
  boldText: {
    fontWeight: 'bold',
    color: '#0F172A',
  },
  anglesInfo: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '600',
  },
});
