import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { COLORS, FONTS, RADIUS } from '../../constants/theme';
import {
  sendAssistantChatMessage,
  ChatMessage,
  AssistantChatResult,
} from '../../services/aiApi';
import { CheckoutBackIcon } from '../../components/CheckoutFigmaIcons';

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  basket?: AssistantChatResult['basket'];
}

export default function AIAssistantChatScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { city } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const scrollViewRef = useRef<ScrollView>(null);

  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>([
    '👨‍👩‍👧‍👦 4-Person Veg Basket',
    '💰 Plan under ₹4,000',
    '🏷️ Save ₹500 vs last month',
    '🥜 Suggest Healthy Snacks',
  ]);

  const [messages, setMessages] = useState<DisplayMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: 'Namaste! 🙏 Main aapka MonthlyGrocery AI Assistant hoon.\n\nAap mujhe apne family size, monthly budget, ya last month ke expenses bata sakte hain—main aapke liye sabse sasta aur best monthly basket taiyyar kar dunga!',
    },
  ]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMsg).trim();
    if (!text || loading) return;

    const userMsgId = `user-${Date.now()}`;
    const userDisplayMsg: DisplayMessage = {
      id: userMsgId,
      role: 'user',
      content: text,
    };

    const nextMessages = [...messages, userDisplayMsg];
    setMessages(nextMessages);
    setInputMsg('');
    setLoading(true);

    try {
      const apiHistory: ChatMessage[] = nextMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await sendAssistantChatMessage(apiHistory, city || undefined);

      const assistantDisplayMsg: DisplayMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        basket: res.basket,
      };

      setMessages((prev) => [...prev, assistantDisplayMsg]);
      if (res.quick_replies && res.quick_replies.length > 0) {
        setQuickReplies(res.quick_replies);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Maaf kijiye, message process karne mein dikkat aayi. Kripya dobara try karein!',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBasketToCart = (basket: AssistantChatResult['basket']) => {
    if (!basket || !basket.items) return;

    let count = 0;
    basket.items.forEach((it) => {
      const p = it.product;
      const qty = it.quantity || 1;
      for (let i = 0; i < qty; i++) {
        addToCart({
          id: p.id,
          shop_id: '',
          name: p.name,
          brand: p.brand,
          primary_category: 'Groceries',
          image_url: p.image_url,
          unit: p.unit,
          mrp: p.mrp,
          price: p.price,
          stock: 50,
          available: true,
          in_stock: true,
        });
      }
      count++;
    });

    showToast(`Added ${count} items from AI Basket to your Cart!`, 'success');
    navigation.navigate('Cart');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={12}>
          <CheckoutBackIcon color={COLORS.ink900} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>AI Grocery Assistant</Text>
          <View style={styles.onlineBadge}>
            <View style={styles.greenDot} />
            <Text style={styles.onlineText}>Active Planner & Budget Optimizer</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        {/* Chat Feed */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.chatScroll}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <View key={msg.id} style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAssistant]}>
                {!isUser && (
                  <View style={styles.assistantAvatar}>
                    <Text style={{ fontSize: 16 }}>🤖</Text>
                  </View>
                )}

                <View style={[styles.msgBubble, isUser ? styles.msgBubbleUser : styles.msgBubbleAssistant]}>
                  <Text style={[styles.msgText, isUser ? styles.msgTextUser : styles.msgTextAssistant]}>
                    {msg.content}
                  </Text>

                  {/* Interactive In-Chat Basket Preview Card */}
                  {msg.basket && (
                    <View style={styles.basketCard}>
                      <View style={styles.basketCardHeader}>
                        <Text style={styles.basketCardTitle}>{msg.basket.title || 'Recommended Basket'}</Text>
                        {msg.basket.savings > 0 && (
                          <View style={styles.savingsPill}>
                            <Text style={styles.savingsPillText}>Save ₹{msg.basket.savings.toFixed(0)}</Text>
                          </View>
                        )}
                      </View>

                      {/* Items Preview */}
                      <View style={styles.basketItemsList}>
                        {msg.basket.items.map((it, idx) => (
                          <View key={idx} style={styles.basketItemRow}>
                            <Text style={styles.basketItemName} numberOfLines={1}>
                              • {it.product.name} ({it.product.unit || 'pack'})
                            </Text>
                            <Text style={styles.basketItemPrice}>
                              {it.quantity} × ₹{it.product.price}
                            </Text>
                          </View>
                        ))}
                      </View>

                      {/* Basket Total & Add Action */}
                      <View style={styles.basketCardFooter}>
                        <View>
                          <Text style={styles.basketTotalLabel}>Total ({msg.basket.items.length} items):</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                            {msg.basket.total_mrp > msg.basket.total_price && (
                              <Text style={styles.mrpStrike}>₹{msg.basket.total_mrp.toFixed(0)}</Text>
                            )}
                            <Text style={styles.basketTotalPrice}>₹{msg.basket.total_price.toFixed(0)}</Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={styles.transferBtn}
                          onPress={() => handleAddBasketToCart(msg.basket)}
                        >
                          <Text style={styles.transferBtnText}>Add All to Cart 🛒</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          {/* Assistant Typing Indicator */}
          {loading && (
            <View style={[styles.msgRow, styles.msgRowAssistant]}>
              <View style={styles.assistantAvatar}>
                <Text style={{ fontSize: 16 }}>🤖</Text>
              </View>
              <View style={[styles.msgBubble, styles.msgBubbleAssistant, styles.typingBubble]}>
                <ActivityIndicator size="small" color={COLORS.green700} />
                <Text style={styles.typingText}>AI is calculating best prices & basket...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick Suggestion Chips */}
        {quickReplies.length > 0 && (
          <View style={styles.quickChipsWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
              {quickReplies.map((chip, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.quickChip}
                  onPress={() => handleSendMessage(chip)}
                  disabled={loading}
                >
                  <Text style={styles.quickChipText}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Bottom Input Box */}
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            style={styles.chatInput}
            placeholder="Ask AI: e.g. 4 logon ka budget plan bana do..."
            placeholderTextColor={COLORS.ink300}
            value={inputMsg}
            onChangeText={setInputMsg}
            multiline
            maxLength={300}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!inputMsg.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => handleSendMessage()}
            disabled={!inputMsg.trim() || loading}
          >
            <Text style={styles.sendBtnText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    ...FONTS.balooBold,
    fontSize: 17,
    color: COLORS.ink900,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: -2,
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  onlineText: {
    ...FONTS.muktaMedium,
    fontSize: 11,
    color: COLORS.green700,
  },
  chatScroll: {
    padding: 16,
    paddingBottom: 20,
  },
  msgRow: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  msgRowUser: {
    justifyContent: 'flex-end',
  },
  msgRowAssistant: {
    justifyContent: 'flex-start',
  },
  assistantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.green100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  msgBubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  msgBubbleUser: {
    backgroundColor: COLORS.green700,
    borderBottomRightRadius: 2,
  },
  msgBubbleAssistant: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderBottomLeftRadius: 2,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20,
  },
  msgTextUser: {
    ...FONTS.muktaMedium,
    color: '#FFFFFF',
  },
  msgTextAssistant: {
    ...FONTS.muktaRegular,
    color: COLORS.ink900,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: COLORS.ink500,
  },
  basketCard: {
    backgroundColor: COLORS.green50,
    borderRadius: RADIUS.sm,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.green100,
  },
  basketCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  basketCardTitle: {
    ...FONTS.balooBold,
    fontSize: 14,
    color: COLORS.green900,
    flex: 1,
  },
  savingsPill: {
    backgroundColor: COLORS.marigold500,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  savingsPillText: {
    ...FONTS.muktaBold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  basketItemsList: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.green100,
    paddingVertical: 6,
    gap: 4,
  },
  basketItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  basketItemName: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    color: COLORS.ink800,
    flex: 1,
    marginRight: 6,
  },
  basketItemPrice: {
    ...FONTS.balooBold,
    fontSize: 12,
    color: COLORS.green900,
  },
  basketCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  basketTotalLabel: {
    ...FONTS.muktaRegular,
    fontSize: 11,
    color: COLORS.ink600,
  },
  mrpStrike: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: COLORS.ink400,
    textDecorationLine: 'line-through',
  },
  basketTotalPrice: {
    ...FONTS.balooBold,
    fontSize: 16,
    color: COLORS.green900,
  },
  transferBtn: {
    backgroundColor: COLORS.green700,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
  },
  transferBtnText: {
    ...FONTS.balooBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  quickChipsWrap: {
    paddingVertical: 8,
    backgroundColor: COLORS.paper,
  },
  quickChip: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.green600,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  quickChipText: {
    ...FONTS.muktaSemiBold,
    fontSize: 12,
    color: COLORS.green800,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    gap: 8,
  },
  chatInput: {
    flex: 1,
    ...FONTS.muktaRegular,
    fontSize: 14,
    color: COLORS.ink900,
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 90,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.green700,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.ink300,
  },
  sendBtnText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 2,
  },
});
