import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '../../store/userStore';
import { useChatStore } from '../../store/chatStore';
import { callGemini } from '../../services/geminiApi';
import { Colors } from '../../theme/colors';
import { FontSizes, FontWeights, FontFamily } from '../../theme/typography';
import { Spacing, Radius, Shadow } from '../../theme/spacing';
import { ChatMessage } from '../../types';
import { generateId, calculateTDEE } from '../../utils/helpers';

const QUICK_PROMPTS = [
  'What should I eat for breakfast?',
  'Is my lunch too high in carbs?',
  'Suggest a healthy snack',
  'How much protein do I need?',
  'What can I eat for my condition?',
];

const buildSystemPrompt = (profile: any, consumed: number, target: number): string => {
  if (!profile) return 'You are a helpful nutrition assistant. Only answer food and nutrition questions.';
  return `You are NutriScan AI, a personalized nutrition assistant.
User profile:
- Name: ${profile.name}, Age: ${profile.age}, Weight: ${profile.weightKg}kg, Height: ${profile.heightCm}cm
- Diet: ${profile.dietType}, Goal: ${profile.goal}
- Allergies: ${profile.allergies.join(', ')}
- Medical conditions: ${profile.conditions.join(', ')}
- Today: ${consumed} / ${target} kcal consumed
Rules: Only answer food, nutrition, diet, and health-related questions. Decline off-topic questions politely. Be concise, warm, and personalized. Mention the user's name occasionally.`;
};

const TypingIndicator = () => (
  <View style={styles.typingBubble}>
    <Text style={styles.typingEmoji}>🌿</Text>
    <Text style={styles.typingDots}>● ● ●</Text>
  </View>
);

export const ChatScreen: React.FC = () => {
  const { profile } = useUserStore();
  const { messages, isTyping, addMessage, setTyping, loadMessages } = useChatStore();
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => { loadMessages(); }, []);
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, isTyping]);

  const target = profile ? calculateTDEE(profile) : 1800;

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    setInput('');

    const userMsg: ChatMessage = {
      id: generateId(), role: 'user', content: text.trim(),
      timestamp: new Date().toISOString(),
    };
    await addMessage(userMsg);
    setTyping(true);

    try {
      const systemPrompt = buildSystemPrompt(profile, 0, target);
      const response = await callGemini(text, systemPrompt);

      const aiMsg: ChatMessage = {
        id: generateId(), role: 'assistant', content: response,
        timestamp: new Date().toISOString(), isPersonalized: true,
      };
      await addMessage(aiMsg);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: generateId(), role: 'assistant',
        content: `Sorry, I couldn't process that right now. Please check your internet connection and try again. 🌿`,
        timestamp: new Date().toISOString(),
      };
      await addMessage(errorMsg);
    } finally {
      setTyping(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.aiAvatarRing}>
              <Text style={styles.aiAvatar}>🌿</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>NutriScan AI</Text>
              <Text style={styles.headerSub}>Your personal nutrition advisor</Text>
            </View>
            <View style={styles.onlineDot} />
          </View>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
          {/* Messages */}
          <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={styles.messagesContent} showsVerticalScrollIndicator={false}>
            {messages.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🌿</Text>
                <Text style={styles.emptyTitle}>Hi{profile ? `, ${profile.name.split(' ')[0]}` : ''}!</Text>
                <Text style={styles.emptyText}>I'm your personalized nutrition AI. Ask me anything about food, diet, or your health goals!</Text>
              </View>
            )}

            {messages.map(msg => (
              <View key={msg.id} style={[styles.bubbleRow, msg.role === 'user' && styles.bubbleRowUser]}>
                {msg.role === 'assistant' && <Text style={styles.bubbleAvatar}>🌿</Text>}
                <View style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAI]}>
                  {msg.isPersonalized && msg.role === 'assistant' && (
                    <View style={styles.personalizedTag}>
                      <Text style={styles.personalizedText}>✨ Based on your profile</Text>
                    </View>
                  )}
                  <Text style={[styles.bubbleText, msg.role === 'user' && styles.bubbleTextUser]}>{msg.content}</Text>
                  <Text style={[styles.timestamp, msg.role === 'user' && styles.timestampUser]}>
                    {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            ))}
            {isTyping && (
              <View style={styles.bubbleRow}>
                <Text style={styles.bubbleAvatar}>🌿</Text>
                <TypingIndicator />
              </View>
            )}
          </ScrollView>

          {/* Quick prompts */}
          {messages.length === 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickPromptsScroll} contentContainerStyle={styles.quickPromptsContent}>
              {QUICK_PROMPTS.map((p, i) => (
                <TouchableOpacity key={i} style={styles.quickPrompt} onPress={() => sendMessage(p)}>
                  <Text style={styles.quickPromptText}>{p}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Input bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask about food, diet, nutrition..."
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || isTyping) && styles.sendBtnDisabled]}
              onPress={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
            >
              <Text style={styles.sendIcon}>➤</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
};



const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    backgroundColor: Colors.surface, borderBottomWidth: 1,
    borderBottomColor: Colors.divider, paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  aiAvatarRing: {
    width: 46, height: 46, borderRadius: 23,
    borderWidth: 2.5, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.primaryGlow,
  },
  aiAvatar: { fontSize: 24 },
  headerTitle: { fontFamily: FontFamily.display, fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  headerSub: { fontFamily: FontFamily.body, fontSize: FontSizes.xs, color: Colors.textSecondary },
  onlineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary, ...Shadow.primaryGlow },

  // Messages
  messages: { flex: 1 },
  messagesContent: { padding: Spacing[4], gap: Spacing[3], paddingBottom: Spacing[4] },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: Spacing[10], gap: Spacing[3] },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontFamily: FontFamily.display, fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: Colors.textPrimary },
  emptyText: { fontFamily: FontFamily.body, fontSize: FontSizes.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },

  // Chat bubbles
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing[2] },
  bubbleRowUser: { flexDirection: 'row-reverse' },
  bubbleAvatar: {
    fontSize: 18, width: 34, height: 34, textAlign: 'center', textAlignVertical: 'center',
    backgroundColor: Colors.surface, borderRadius: 17,
    borderWidth: 1.5, borderColor: Colors.primary, overflow: 'hidden',
  },
  bubble: { maxWidth: '80%', borderRadius: Radius.xl, padding: Spacing[3], gap: Spacing[1] },
  bubbleAI: {
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    borderBottomLeftRadius: Radius.xs,
    ...Shadow.sm,
  },
  bubbleUser: {
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1.5, borderColor: Colors.primary,
    borderBottomRightRadius: Radius.xs,
  },
  personalizedTag: {
    backgroundColor: Colors.primaryMuted, borderRadius: Radius.full,
    paddingHorizontal: Spacing[2], paddingVertical: 2, alignSelf: 'flex-start',
  },
  personalizedText: { fontFamily: FontFamily.body, fontSize: FontSizes.xs, color: Colors.primary, fontWeight: FontWeights.semibold },
  bubbleText: { fontFamily: FontFamily.body, fontSize: FontSizes.base, color: Colors.textPrimary, lineHeight: 22 },
  bubbleTextUser: { color: Colors.primary },
  timestamp: { fontFamily: FontFamily.body, fontSize: FontSizes.xs, color: Colors.textMuted, alignSelf: 'flex-end' },
  timestampUser: { color: Colors.primary, opacity: 0.7 },

  // Typing indicator
  typingBubble: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing[3], gap: Spacing[2],
    borderWidth: 1, borderColor: Colors.border,
  },
  typingEmoji: { fontSize: 16 },
  typingDots: { fontFamily: FontFamily.body, fontSize: FontSizes.base, color: Colors.primary, letterSpacing: 4 },

  // Quick prompts
  quickPromptsScroll: { maxHeight: 56 },
  quickPromptsContent: { paddingHorizontal: Spacing[4], gap: Spacing[2], paddingBottom: Spacing[2], alignItems: 'center' },
  quickPrompt: {
    backgroundColor: Colors.surface, borderRadius: Radius.full,
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[2],
    borderWidth: 1.5, borderColor: Colors.borderActive,
  },
  quickPromptText: { fontFamily: FontFamily.body, fontSize: FontSizes.sm, color: Colors.primary, fontWeight: FontWeights.semibold } as any,

  // Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    padding: Spacing[3], borderTopWidth: 1,
    borderTopColor: Colors.divider,
    backgroundColor: Colors.surface, gap: Spacing[2],
  },
  input: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.xl, paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3], fontSize: FontSizes.base,
    color: Colors.textPrimary, maxHeight: 100,
    backgroundColor: Colors.background,
    fontFamily: FontFamily.body,
  },
  sendBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.primaryGlow,
  },
  sendBtnDisabled: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  sendIcon: { fontSize: 18, color: Colors.textInverse, marginLeft: 2 },
});
