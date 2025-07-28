import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { PieChart as ChartKitPieChart } from 'react-native-chart-kit';
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
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Text style={[styles.emptyText, { color: colors.text }]}>No data</Text>
      </View>
    );
  }

  // Transform data for the chart-kit library
  const chartData = data.map((item, index) => ({
    name: item.label,
    population: item.value,
    color: item.color,
    legendFontColor: colors.text,
    legendFontSize: 12,
  }));

  const screenWidth = Dimensions.get('window').width;
  const availableWidth = screenWidth - 80; // Account for container padding
  const chartWidth = availableWidth * 0.6; // 60% for chart
  const legendWidth = availableWidth * 0.35; // 35% for legend (5% for spacing)

  return (
    <View style={[styles.container, { width: '100%', height: size, backgroundColor: colors.background }]}>
      <View style={styles.chartLayout}>
        <ChartKitPieChart
          data={chartData}
          width={chartWidth}
          height={size * 0.8}
          chartConfig={{
            backgroundColor: colors.background,
            backgroundGradientFrom: colors.background,
            backgroundGradientTo: colors.background,
            color: (opacity = 1) => colors.text,
          }}
          accessor="population"
          backgroundColor={colors.background}
          paddingLeft="0"
          absolute={false}
          hasLegend={false}
        />
        
        {/* Custom legend positioned to the side */}
        <View style={[styles.legendContainer, { width: legendWidth }]}>
          {data.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <Text style={[styles.legendText, { color: colors.text }]} numberOfLines={2}>
                {item.label}
              </Text>
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
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 40,
  },
  legendContainer: {
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 10,
    flex: 1,
    flexShrink: 1,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.7,
  },
}); 