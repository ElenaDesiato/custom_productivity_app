import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

interface PieChartData {
  label: string;
  value: number;
  color: string;
  percentage: number;
}

interface PieChartProps {
  data: PieChartData[];
  size?: number;
}

export function PieChart({ data, size = 250 }: PieChartProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (data.length === 0) {
    return null;
  }

  const screenWidth = Dimensions.get('window').width;
  const chartSize = Math.min(160, screenWidth * 0.35);
  const radius = chartSize / 2;
  const centerX = radius;
  const centerY = radius;

  // Calculate pie slices
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;
  
  const slices = data.map((item, index) => {
    const sliceAngle = (item.value / total) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    let pathData;
    
    // Handle single slice (full circle) case
    if (data.length === 1) {
      pathData = [
        `M ${centerX} ${centerY}`,
        `m -${radius} 0`,
        `a ${radius} ${radius} 0 1 1 ${radius * 2} 0`,
        `a ${radius} ${radius} 0 1 1 -${radius * 2} 0`,
        'Z'
      ].join(' ');
    } else {
      // Create pie slice path for multiple slices
      const x1 = centerX + radius * Math.cos(startAngle);
      const y1 = centerY + radius * Math.sin(startAngle);
      const x2 = centerX + radius * Math.cos(endAngle);
      const y2 = centerY + radius * Math.sin(endAngle);

      const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

      pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');
    }

    return {
      pathData,
      color: item.color,
      percentage: item.percentage,
      label: item.label,
    };
  });

  return (
    <View style={[styles.container, { width: '100%', height: size, backgroundColor: colors.background }]}>
      <View style={styles.chartLayout}>
        <View style={styles.chartWrapper}>
          <Svg width={chartSize} height={chartSize}>
            <Defs>
              {slices.map((slice, index) => (
                <LinearGradient key={index} id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor={slice.color} stopOpacity="1" />
                  <Stop offset="100%" stopColor={slice.color} stopOpacity="0.7" />
                </LinearGradient>
              ))}
            </Defs>
            <G>
              {slices.map((slice, index) => (
                <Path
                  key={index}
                  d={slice.pathData}
                  fill={slice.color}
                  stroke={colors.background}
                  strokeWidth="2"
                />
              ))}
            </G>
          </Svg>
        </View>
        
        {/* Custom legend */}
        <View style={styles.legendContainer}>
          {data.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <View style={styles.legendTextContainer}>
                <Text style={[styles.legendText, { color: colors.text }]} numberOfLines={1}>
                  {item.label}
                </Text>
                <Text style={[styles.legendPercentage, { color: colors.text }]}>
                  {item.percentage.toFixed(1)}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  legendContainer: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendTextContainer: {
    flex: 1,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  legendPercentage: {
    fontSize: 10,
    opacity: 0.7,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.7,
  },
}); 