/**
 * VideoCallScreen – simulates a video/voice consultation UI.
 * In production integrate Twilio Video or WebRTC.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Animated, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { HomeStackParamList, Appointment } from '../../types';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { Avatar } from '../../components/ui/primitives';
import { ErrorState } from '../../components/ui/ErrorState';
import { AppointmentService } from '../../services/api';

type NavProp   = NativeStackNavigationProp<HomeStackParamList, 'VideoCall'>;
type RouteType = RouteProp<HomeStackParamList, 'VideoCall'>;

const VideoCallScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route      = useRoute<RouteType>();
  const { appointmentId } = route.params;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted]           = useState(false);
  const [isCamOff, setIsCamOff]         = useState(false);
  const [isSpeaker, setIsSpeaker]       = useState(true);
  const [callStatus, setCallStatus]     = useState<'connecting' | 'active' | 'ended'>('connecting');

  const pulseAnim = new Animated.Value(1);

  const loadAppointment = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await AppointmentService.getAppointmentById(appointmentId);
      setAppointment(data);
    } catch (err: any) {
      setError(err.message || 'Unable to connect to telemedicine video channel.');
    } finally {
      setIsLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    loadAppointment();
  }, [loadAppointment]);

  const doctorName = appointment?.doctor?.name || 'Dr. Mitchell';
  const doctorImage = appointment?.doctor?.profileImage;
  const doctorSpecialty = appointment?.doctor?.specialty || 'Consultant';

  // Simulate connection
  useEffect(() => {
    if (!appointment) return;
    const timer = setTimeout(() => setCallStatus('active'), 2500);
    return () => clearTimeout(timer);
  }, [appointment]);

  // Call timer
  useEffect(() => {
    if (callStatus !== 'active') return;
    const interval = setInterval(() => setCallDuration(d => d + 1), 1000);
    return () => clearInterval(interval);
  }, [callStatus]);

  // Pulse animation for connecting state
  useEffect(() => {
    if (callStatus !== 'connecting') return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [callStatus, pulseAnim]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const endCall = () => {
    setCallStatus('ended');
    setTimeout(() => navigation.goBack(), 1500);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.white} />
        <Text style={{ color: Colors.white, marginTop: 12 }}>Preparing secure consultation room…</Text>
      </SafeAreaView>
    );
  }

  if (error || !appointment) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          title="Consultation Unavailable"
          message={error || 'Appointment record not found.'}
          onRetry={loadAppointment}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Remote video area (simulated dark gradient bg) */}
      <LinearGradient colors={[Colors.neutral[900], Colors.neutral[800]]} style={styles.remoteVideo}>

        {/* Connecting / ended overlay */}
        {(callStatus === 'connecting' || callStatus === 'ended') && (
          <View style={styles.overlay}>
            <Animated.View style={[styles.avatarPulse, { transform: [{ scale: pulseAnim }] }]}>
              <Avatar
                uri={doctorImage}
                name={doctorName}
                size={100}
              />
            </Animated.View>
            <Text style={styles.overlayName}>{doctorName}</Text>
            <Text style={styles.overlayStatus}>
              {callStatus === 'connecting' ? 'Connecting…' : 'Call Ended'}
            </Text>
          </View>
        )}

        {/* Header bar */}
        <View style={styles.callHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-down" size={24} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.callInfo}>
            <Text style={styles.calleeName}>{doctorName}</Text>
            <Text style={styles.callDuration}>
              {callStatus === 'active' ? formatDuration(callDuration) :
               callStatus === 'connecting' ? 'Connecting…' : 'Ended'}
            </Text>
          </View>
          <View style={styles.callQuality}>
            <Ionicons name="cellular" size={16} color={Colors.success.main} />
          </View>
        </View>

        {/* Self video (PiP) */}
        {!isCamOff && (
          <View style={styles.selfVideo}>
            <Avatar name="You" size={80} />
            <Text style={styles.selfLabel}>You</Text>
          </View>
        )}
      </LinearGradient>

      {/* Controls */}
      <View style={styles.controls}>
        <View style={styles.controlRow}>
          <CallControl
            icon={isMuted ? 'mic-off' : 'mic-outline'}
            label={isMuted ? 'Unmute' : 'Mute'}
            onPress={() => setIsMuted(v => !v)}
            active={isMuted}
          />
          <CallControl
            icon={isCamOff ? 'videocam-off' : 'videocam-outline'}
            label={isCamOff ? 'Start Cam' : 'Stop Cam'}
            onPress={() => setIsCamOff(v => !v)}
            active={isCamOff}
          />
          <CallControl
            icon="chatbubble-outline"
            label="Chat"
            onPress={() => {}}
          />
          <CallControl
            icon={isSpeaker ? 'volume-high-outline' : 'volume-low-outline'}
            label="Speaker"
            onPress={() => setIsSpeaker(v => !v)}
            active={!isSpeaker}
          />
        </View>

        {/* End call button */}
        <TouchableOpacity style={styles.endCallBtn} onPress={endCall}>
          <Ionicons name="call" size={28} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ─── CallControl helper ───────────────────────────────────────────────────────

interface CallControlProps {
  icon: any;
  label: string;
  onPress: () => void;
  active?: boolean;
}

const CallControl: React.FC<CallControlProps> = ({ icon, label, onPress, active }) => (
  <TouchableOpacity style={styles.controlBtn} onPress={onPress}>
    <View style={[styles.controlBtnInner, active && styles.controlBtnActive]}>
      <Ionicons name={icon} size={22} color={active ? Colors.error.main : Colors.neutral[700]} />
    </View>
    <Text style={styles.controlLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral[900] },

  remoteVideo: { flex: 1, position: 'relative' },

  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: Spacing[3] },
  avatarPulse: { padding: 8, borderRadius: BorderRadius.full, backgroundColor: 'rgba(255,255,255,0.08)' },
  overlayName: { fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.bold, color: Colors.white },
  overlayStatus: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.regular, color: 'rgba(255,255,255,0.6)' },

  callHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[4],
    gap: Spacing[3],
  },
  backBtn: { padding: Spacing[2] },
  callInfo: { flex: 1 },
  calleeName: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: Colors.white },
  callDuration: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, color: 'rgba(255,255,255,0.6)' },
  callQuality: {},

  selfVideo: {
    position: 'absolute',
    bottom: Spacing[5],
    right: Spacing[5],
    width: 90,
    height: 120,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[1],
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  selfLabel: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, color: Colors.white },

  controls: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[6],
    gap: Spacing[5],
  },
  controlRow: { flexDirection: 'row', justifyContent: 'space-around' },
  controlBtn: { alignItems: 'center', gap: Spacing[2] },
  controlBtnInner: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnActive: { backgroundColor: Colors.error.light },
  controlLabel: { fontSize: 10, fontFamily: Typography.fontFamily.regular, color: Colors.neutral[600] },

  endCallBtn: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.error.main,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '135deg' }],
  },
});

export default VideoCallScreen;
