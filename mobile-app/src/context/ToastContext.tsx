import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS, RADIUS } from '../constants/theme';
import { SvgXml } from 'react-native-svg';

const SUCCESS_ICON_XML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="#22C55E" fill-opacity="0.2"/><path d="M16 9L10.5 14.5L8 12" stroke="#22C55E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ERROR_ICON_XML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="#EF4444" fill-opacity="0.2"/><path d="M12 8V12M12 16H12.01" stroke="#EF4444" stroke-width="2.2" stroke-linecap="round"/></svg>`;
const INFO_ICON_XML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="#38BDF8" fill-opacity="0.2"/><path d="M12 16V12M12 8H12.01" stroke="#38BDF8" stroke-width="2.2" stroke-linecap="round"/></svg>`;
const BAG_WHITE_XML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="#22C55E" fill-opacity="0.2"/><path d="M8 7L6 9.5V17C6 17.5304 6.21071 18.0391 6.58579 18.4142C6.96086 18.7893 7.46957 19 8 19H16C16.5304 19 17.0391 18.7893 17.4142 18.4142C17.7893 18.0391 18 17.5304 18 17V9.5L16 7H8Z" stroke="#22C55E" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 9.5H18" stroke="#22C55E" stroke-width="1.8" stroke-linecap="round"/><path d="M14 12C14 13.1 13.1 14 12 14C10.9 14 10 13.1 10 12" stroke="#22C55E" stroke-width="1.8" stroke-linecap="round"/></svg>`;

export type ToastType = 'success' | 'error' | 'info' | 'cart';

export interface ToastOptions {
  title?: string;
  message: string;
  type?: ToastType;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

interface ToastContextType {
  showToast: (options: ToastOptions | string) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
  hideToast: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<any>(null);

  const hideToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(null);
    });
  }, [translateY, opacity]);

  const showToast = useCallback(
    (options: ToastOptions | string) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      const opts: ToastOptions =
        typeof options === 'string'
          ? { message: options, type: 'info' }
          : { type: 'info', ...options };

      setToast(opts);
      translateY.setValue(100);
      opacity.setValue(0);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 75,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const duration = opts.duration ?? (opts.actionLabel ? 4200 : 3000);
      timerRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    },
    [translateY, opacity, hideToast],
  );

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast ? (
        <View
          style={[
            styles.toastOverlay,
            { bottom: Math.max(insets.bottom + 16, 24) },
          ]}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              styles.toastContainer,
              {
                transform: [{ translateY }],
                opacity,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.toastCard}
              onPress={hideToast}
              activeOpacity={0.92}
            >
              <View style={styles.iconCircle}>
                {toast.type === 'error' ? (
                  <SvgXml xml={ERROR_ICON_XML} width={22} height={22} />
                ) : toast.type === 'cart' ? (
                  <SvgXml xml={BAG_WHITE_XML} width={22} height={22} />
                ) : toast.type === 'success' ? (
                  <SvgXml xml={SUCCESS_ICON_XML} width={22} height={22} />
                ) : (
                  <SvgXml xml={INFO_ICON_XML} width={22} height={22} />
                )}
              </View>

              <View style={styles.textCol}>
                {toast.title ? (
                  <Text style={styles.toastTitle} numberOfLines={1}>
                    {toast.title}
                  </Text>
                ) : null}
                <Text style={styles.toastMessage} numberOfLines={2}>
                  {toast.message}
                </Text>
              </View>

              {toast.actionLabel ? (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => {
                    hideToast();
                    if (toast.onAction) toast.onAction();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionBtnText}>{toast.actionLabel}</Text>
                </TouchableOpacity>
              ) : null}
            </TouchableOpacity>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  toastOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 999999,
    elevation: 999999,
  },
  toastContainer: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  toastCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B', // Standard modern dark slate snackbar
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  iconCircle: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textCol: {
    flex: 1,
    paddingRight: 6,
  },
  toastTitle: {
    ...FONTS.muktaBold,
    fontSize: 14.5,
    color: '#FFFFFF',
    lineHeight: 19,
  },
  toastMessage: {
    ...FONTS.muktaMedium,
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 18,
  },
  actionBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    marginLeft: 8,
  },
  actionBtnText: {
    ...FONTS.muktaBold,
    fontSize: 12.5,
    color: '#38BDF8',
  },
});


