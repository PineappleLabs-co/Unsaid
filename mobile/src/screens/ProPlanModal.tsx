import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { Check } from 'lucide-react-native';
import { AppHeader } from '../components/AppHeader';
import { CosmicBackground } from '../components/CosmicBackground';
import { COLORS } from '../theme';

interface ProPlanModalProps {
  onBackClick: () => void;
  onContinue: (plan: 'Free' | 'Pro') => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44 - 12) / 2;

export const ProPlanModal: React.FC<ProPlanModalProps> = ({
  onBackClick,
  onContinue,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<'Free' | 'Pro'>('Pro');

  return (
    <CosmicBackground style={styles.container}>
      <AppHeader onBackClick={onBackClick} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Brain Orb Artwork */}
        <View style={styles.orbWrap}>
          <Image
            source={require('../../assets/brain_orb.png')}
            style={styles.orb}
            resizeMode="contain"
          />
        </View>

        {/* Title & Subtitle */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>
            Go Further With Our <Text style={{ color: COLORS.cyanGlow }}>Pro</Text> Plan
          </Text>
          <Text style={styles.subtitle}>
            Turn your thoughts into detailed plans, document and insights.
          </Text>
        </View>

        {/* Monthly / Yearly Toggle */}
        <View style={styles.billingToggleRow}>
          <TouchableOpacity
            style={[styles.cycleBtn, billingCycle === 'monthly' && styles.cycleBtnActive]}
            onPress={() => setBillingCycle('monthly')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.cycleBtnText,
                billingCycle === 'monthly' && styles.cycleBtnTextActive,
              ]}
            >
              Monthly
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cycleBtn, billingCycle === 'yearly' && styles.cycleBtnActive]}
            onPress={() => setBillingCycle('yearly')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.cycleBtnText,
                billingCycle === 'yearly' && styles.cycleBtnTextActive,
              ]}
            >
              Yearly <Text style={{ color: COLORS.proYellow, fontWeight: '800' }}>Save 40%</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Plans Grid */}
        <View style={styles.plansGrid}>
          {/* Free Card */}
          <TouchableOpacity
            style={[styles.planCard, selectedPlan === 'Free' && styles.planCardSelected]}
            onPress={() => setSelectedPlan('Free')}
            activeOpacity={0.85}
          >
            <Text style={styles.planCardTitle}>Free</Text>
            <Text style={styles.planCreditsText}>2 AI Credits / Month</Text>
            <Text style={styles.planPrice}>₹0</Text>

            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Check size={14} color={COLORS.textMuted} />
                <Text style={styles.featureItemText}>Basic Capture</Text>
              </View>
              <View style={styles.featureItem}>
                <Check size={14} color={COLORS.textMuted} />
                <Text style={styles.featureItemText}>AI Organize</Text>
              </View>
              <View style={styles.featureItem}>
                <Check size={14} color={COLORS.textMuted} />
                <Text style={styles.featureItemText}>2 Detailed Plans</Text>
              </View>
              <View style={styles.featureItem}>
                <Check size={14} color={COLORS.textMuted} />
                <Text style={styles.featureItemText}>All Core Features</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Pro Card */}
          <TouchableOpacity
            style={[
              styles.planCard,
              styles.proCard,
              selectedPlan === 'Pro' && styles.planCardSelected,
            ]}
            onPress={() => setSelectedPlan('Pro')}
            activeOpacity={0.85}
          >
            <Text style={styles.planCardTitle}>Pro</Text>
            <Text style={styles.planCreditsText}>50 AI Credits / Month</Text>
            <View style={styles.proPriceRow}>
              <Text style={styles.planPrice}>
                {billingCycle === 'monthly' ? '₹299' : '₹179'}
              </Text>
              <Text style={styles.perMonthText}>/mo</Text>
            </View>

            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Check size={14} color={COLORS.cyanGlow} />
                <Text style={styles.featureItemText}>All Features</Text>
              </View>
              <View style={styles.featureItem}>
                <Check size={14} color={COLORS.cyanGlow} />
                <Text style={styles.featureItemText}>50 Detailed Plans</Text>
              </View>
              <View style={styles.featureItem}>
                <Check size={14} color={COLORS.cyanGlow} />
                <Text style={styles.featureItemText}>Advanced Models</Text>
              </View>
              <View style={styles.featureItem}>
                <Check size={14} color={COLORS.cyanGlow} />
                <Text style={styles.featureItemText}>Export PDF/Docs</Text>
              </View>
              <View style={styles.featureItem}>
                <Check size={14} color={COLORS.cyanGlow} />
                <Text style={styles.featureItemText}>Priority Support</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={() => onContinue(selectedPlan)}
          activeOpacity={0.85}
        >
          <Text style={styles.continueBtnText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </CosmicBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingBottom: 30,
  },
  orbWrap: {
    alignItems: 'center',
    marginVertical: 6,
  },
  orb: {
    width: width * 0.4,
    height: width * 0.4,
    maxWidth: 160,
    maxHeight: 160,
  },
  titleSection: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  billingToggleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
    width: '100%',
  },
  cycleBtn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(5, 20, 32, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cycleBtnActive: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.white,
  },
  cycleBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  cycleBtnTextActive: {
    color: COLORS.bgBlack,
  },
  plansGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  planCard: {
    width: CARD_WIDTH,
    backgroundColor: 'rgba(3, 16, 26, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(0, 163, 255, 0.3)',
    borderRadius: 20,
    padding: 16,
    gap: 6,
  },
  proCard: {
    backgroundColor: 'rgba(3, 25, 42, 0.92)',
  },
  planCardSelected: {
    borderColor: COLORS.cyanGlow,
    shadowColor: COLORS.cyanGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  planCardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
  },
  planCreditsText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.white,
    marginVertical: 4,
  },
  proPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginVertical: 4,
  },
  perMonthText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  featureList: {
    gap: 8,
    marginTop: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureItemText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  continueBtn: {
    width: '100%',
    height: 56,
    backgroundColor: COLORS.white,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.white,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  continueBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.bgBlack,
  },
});
