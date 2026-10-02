import React, { useRef, useState } from 'react';
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';

type Props = {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
};

export default function ProductImageZoomModal({ visible, imageUri, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const [scale, setScale] = useState(1);
  const lastTapRef = useRef(0);

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 280) {
      setScale((s) => (s > 1 ? 1 : 2.5));
    }
    lastTapRef.current = now;
  };

  const handleClose = () => {
    setScale(1);
    onClose();
  };

  if (!imageUri) return null;

  const imageStyle = {
    width: width,
    height: height * 0.7,
    transform: [{ scale }],
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.85}>
          <Text style={styles.closeBtnText}>✕ Close</Text>
        </TouchableOpacity>

        {Platform.OS === 'ios' ? (
          <ScrollView
            style={styles.zoomScroll}
            contentContainerStyle={styles.zoomScrollContent}
            maximumZoomScale={4}
            minimumZoomScale={1}
            centerContent
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity activeOpacity={1} onPress={handleDoubleTap}>
              <Image source={{ uri: imageUri }} style={imageStyle} resizeMode="contain" />
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <ScrollView
            style={styles.zoomScroll}
            contentContainerStyle={styles.zoomScrollContent}
            maximumZoomScale={4}
            minimumZoomScale={1}
            pinchGestureEnabled
            centerContent
          >
            <TouchableOpacity activeOpacity={1} onPress={handleDoubleTap}>
              <Image source={{ uri: imageUri }} style={imageStyle} resizeMode="contain" />
            </TouchableOpacity>
          </ScrollView>
        )}

        <Text style={styles.hint}>Pinch or double-tap to zoom</Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  zoomScroll: {
    flex: 1,
  },
  zoomScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 12,
    paddingBottom: 32,
  },
});
