import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StatusBar,
  ActivityIndicator
} from 'react-native';
import { useUserStore } from '../../store/userStore';
import { useChatStore } from '../../store/chatStore';
import { callGemini } from '../../services/geminiApi';
import { Colors } from '../../theme/colors';
import { FontSizes, FontWeights } from '../../theme/typography';
import { Spacing, Radius, Shadow } from '../../theme/spacing';
import { ChatMessage } from '../../types';
import { generateId, calculateTDEE } from '../../utils/helpers';
import { Ionicons } from '@expo/vector-icons';

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

const AvatarLetter = () => (
  <View style={styles.avatarCircle}>
    <Text style={styles.avatarLetter}>N</Text>
  </View>
);

const TypingIndicator = () => (
  <View style={styles.typingBubble}>
    <AvatarLetter />
    <ActivityIndicator size="small" color={Colors.textMuted} />
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
        content: `Sorry, I couldn't process that right now. Please check your internet connection and try again.`,
        timestamp: new Date().toISOString(),
      };
      await addMessage(errorMsg);
    } finally {
      setTyping(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <AvatarLetter />
            <View>
              <Text style={styles.headerTitle}>NutriScan AI</Text>
              <Text style={styles.headerSub}>Your personal nutrition advisor</Text>
            </View>
          </View>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
          {/* Messages */}
          <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={styles.messagesContent} showsVerticalScrollIndicator={false}>
            {messages.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="nutrition" size={56} color={Colors.primary} />
                <Text style={styles.emptyTitle}>Hi{profile ? `, ${profile.name.split(' ')[0]}` : ''}!</Text>
                <Text style={styles.emptyText}>I'm your personalized nutrition AI. Ask me anything about food, diet, or your health goals!</Text>
              </View>
            )}

            {messages.map(msg => (
              <View key={msg.id} style={[styles.bubbleRow, msg.role === 'user' && styles.bubbleRowUser]}>
                {msg.role === 'assistant' && <AvatarLetter />}
                <View style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAI]}>
                  {msg.isPersonalized && msg.role === 'assistant' && (
                    <View style={styles.personalizedTag}>
                      <Ionicons name="sparkles" size={12} color={Colors.primary} />
                      <Text style={styles.personalizedText}>Based on your profile</Text>
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
              <Ionicons name="send" size={18} color="#FFFFFF" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing[5], paddingBottom: Spacing[4], backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 20, fontWeight: FontWeights.bold, color: Colors.primary },
  headerTitle: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: '#FFFFFF' },
  headerSub: { fontSize: FontSizes.sm, color: 'rgba(255,255,255,0.8)' },
  messages: { flex: 1 },
  messagesContent: { padding: Spacing[4], gap: Spacing[3], paddingBottom: Spacing[4] },
  emptyState: { alignItems: 'center', paddingTop: Spacing[10], gap: Spacing[3] },
  emptyTitle: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: Colors.textPrimary },
  emptyText: { fontSize: FontSizes.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing[2] },
  bubbleRowUser: { flexDirection: 'row-reverse' },
  bubble: { maxWidth: '80%', borderRadius: Radius.xl, padding: Spacing[3], gap: Spacing[1] },
  bubbleAI: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider, borderBottomLeftRadius: Radius.sm, ...Shadow.sm },
  bubbleUser: { backgroundColor: Colors.primary, borderBottomRightRadius: Radius.sm },
  personalizedTag: { backgroundColor: Colors.primaryMuted, borderRadius: Radius.full, paddingHorizontal: Spacing[2], paddingVertical: 2, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4 },
  personalizedText: { fontSize: FontSizes.xs, color: Colors.primary, fontWeight: FontWeights.semibold },
  bubbleText: { fontSize: FontSizes.base, color: Colors.textPrimary, lineHeight: 22 },
  bubbleTextUser: { color: '#FFFFFF' },
  timestamp: { fontSize: FontSizes.xs, color: Colors.textMuted, alignSelf: 'flex-end' },
  timestampUser: { color: 'rgba(255,255,255,0.7)' },
  typingBubble: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing[3], gap: Spacing[2], borderWidth: 1, borderColor: Colors.divider, borderBottomLeftRadius: Radius.sm },
  quickPromptsScroll: { maxHeight: 52 },
  quickPromptsContent: { paddingHorizontal: Spacing[4], gap: Spacing[2], paddingBottom: Spacing[2] },
  quickPrompt: { backgroundColor: Colors.primaryMuted, borderRadius: Radius.full, paddingHorizontal: Spacing[4], paddingVertical: Spacing[2], borderWidth: 1, borderColor: Colors.border },
  quickPromptText: { fontSize: FontSizes.sm, color: Colors.primary, fontWeight: FontWeights.medium, whiteSpace: 'nowrap' } as any,
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: Spacing[3], borderTopWidth: 1, borderTopColor: Colors.divider, backgroundColor: Colors.surface, gap: Spacing[2], paddingBottom: 110 },
  input: { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.xl, paddingHorizontal: Spacing[4], paddingVertical: Spacing[3], fontSize: FontSizes.base, color: Colors.textPrimary, maxHeight: 100, backgroundColor: Colors.background },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Shadow.primaryGlow },
  sendBtnDisabled: { backgroundColor: Colors.border },
});
