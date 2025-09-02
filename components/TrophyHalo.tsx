import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

type TrophyHaloProps = {
  size?: number;
  children: React.ReactNode;
  backgroundColor: string;
};

export default function TrophyHalo({ size = 80, children, backgroundColor }: TrophyHaloProps) {
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }] }>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient
            id="halo"
            cx="50%"
            cy="50%"
            rx="50%"
            ry="50%"
            fx="50%"
            fy="50%"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor="#FFD600" stopOpacity="1" />
            <Stop offset="100%" stopColor={backgroundColor} stopOpacity="1" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={size} height={size} fill="url(#halo)" />
      </Svg>
      <View style={styles.centerContent}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
});
