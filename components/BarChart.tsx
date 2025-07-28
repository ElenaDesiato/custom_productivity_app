import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { BarChart as ChartKitBarChart } from 'react-native-chart-kit';

interface BarChartData {
  label: string;
  value: number;
  color: string;
  maxValue: number;
}

interface BarChartProps {
  data: BarChartData[];
  height?: number;
}

export function BarChart({ data, height = 200 }: BarChartProps) {
  if (data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.emptyText}>No data</Text>
      </View>
    );
  }

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 40;

  // Transform data for the chart-kit library
  const chartData = {
    labels: data.map(item => item.label),
    datasets: [
      {
        data: data.map(item => item.value),
        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      },
    ],
  };

  return (
    <View style={[styles.container, { height }]}>
      <ChartKitBarChart
        data={chartData}
        width={chartWidth}
        height={height - 60}
        yAxisLabel=""
        yAxisSuffix="h"
        chartConfig={{
          backgroundColor: 'transparent',
          backgroundGradientFrom: 'transparent',
          backgroundGradientTo: 'transparent',
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          barPercentage: 0.7,
        }}
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
        showValuesOnTopOfBars
        fromZero
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
}); 