import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { G, Rect, Text as SvgText } from 'react-native-svg';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { TaskColorIndicator } from './TaskColorIndicator';

interface BarSegment {
  taskId: string;
  taskName: string;
  projectName: string;
  projectColor: string;
  taskColor?: string;
  hours: number;
  percentage: number;
}

interface BarChartData {
  label: string;
  value: number;
  color: string;
  maxValue: number;
  segments: BarSegment[];
}

interface TaskLegendData {
  taskName: string;
  projectName: string;
  projectColor: string;
  taskColor?: string;
}

interface BarChartProps {
  data: BarChartData[];
  taskLegendData?: TaskLegendData[];
  height?: number;
}

const BARS_PER_PAGE = 7;
const BAR_HEIGHT = 28;
const BAR_GAP = 16;

export function BarChart({ data, taskLegendData = [] }: BarChartProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (data.length === 0) {
    return null;
  }

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 120; // More space for date labels
  const maxValue = Math.max(...data.map(item => item.value), 1);

  // Only show 7 bars at a time, allow vertical scroll for more
  const barRows = data.map((item, index) => {
    const barLength = (item.value / item.maxValue) * (chartWidth - 40); // 40px right margin
    return (
      <View key={index} style={styles.barRow}>
        <Text style={[styles.barDateLabel, { color: colors.text }]} numberOfLines={1}>{item.label}</Text>
        <Svg width={chartWidth} height={BAR_HEIGHT} style={{ flex: 1 }}>
          <G>
            {/* Bar shadow */}
            <Rect
              x={2}
              y={10}
              width={barLength}
              height={BAR_HEIGHT - 12}
              fill="#000"
              opacity={0.08}
              rx={0}
              ry={0}
            />
            {/* Multi-segment bar */}
            {item.segments.length > 0 ? (
              <G>
                {item.segments.map((segment, segmentIndex) => {
                  const segmentWidth = (segment.percentage / 100) * barLength;
                  const segmentX = item.segments
                    .slice(0, segmentIndex)
                    .reduce((sum, seg) => sum + (seg.percentage / 100) * barLength, 0);
                  
                  return (
                    <G key={segmentIndex}>
                      {/* Segment shadow */}
                      <Rect
                        x={segmentX + 2}
                        y={10}
                        width={segmentWidth}
                        height={BAR_HEIGHT - 12}
                        fill="#000"
                        opacity={0.08}
                        rx={0}
                        ry={0}
                      />
                      {/* Segment bar */}
                      {segment.taskColor ? (
                        <G>
                          {/* Bottom half - project color */}
                          <Rect
                            x={segmentX}
                            y={6 + (BAR_HEIGHT - 12) / 2}
                            width={segmentWidth}
                            height={(BAR_HEIGHT - 12) / 2}
                            fill={segment.projectColor}
                            stroke={segment.projectColor}
                            strokeWidth="1"
                            rx={0}
                            ry={0}
                          />
                          {/* Top half - task color */}
                          <Rect
                            x={segmentX}
                            y={6}
                            width={segmentWidth}
                            height={(BAR_HEIGHT - 12) / 2}
                            fill={segment.taskColor}
                            stroke={segment.taskColor}
                            strokeWidth="1"
                            rx={0}
                            ry={0}
                          />
                        </G>
                      ) : (
                        <Rect
                          x={segmentX}
                          y={6}
                          width={segmentWidth}
                          height={BAR_HEIGHT - 12}
                          fill={segment.projectColor}
                          stroke={segment.projectColor}
                          strokeWidth="1"
                          rx={0}
                          ry={0}
                        />
                      )}
                    </G>
                  );
                })}
              </G>
            ) : (
              <Rect
                x={0}
                y={6}
                width={barLength}
                height={BAR_HEIGHT - 12}
                fill="#E0E0E0"
                stroke="#E0E0E0"
                strokeWidth="1"
                rx={0}
                ry={0}
              />
            )}
            {/* Value label */}
            <SvgText
              x={barLength + 8}
              y={BAR_HEIGHT / 2 + 2}
              fontSize="11"
              fontWeight="bold"
              textAnchor="start"
              fill={colors.text}
            >
              {item.value.toFixed(1)}h
            </SvgText>
          </G>
        </Svg>
      </View>
    );
  });

  // Height for 7 bars + gaps, but cap at a reasonable maximum
  const maxBarsToShow = Math.min(data.length, BARS_PER_PAGE);
  const scrollViewHeight = maxBarsToShow * BAR_HEIGHT + (maxBarsToShow - 1) * BAR_GAP;

  return (
    <View style={[styles.container]}> 
      <ScrollView 
        style={{ width: '100%', height: scrollViewHeight }} 
        contentContainerStyle={{ paddingBottom: 10 }} 
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        <View>
          {barRows}
        </View>
      </ScrollView>
      {/* Task Legend */}
      {taskLegendData.length > 0 && (
        <View style={styles.legendContainer}>
          <View style={styles.legendGrid}>
            {taskLegendData.map((task, index) => (
              <View key={index} style={styles.legendItem}>
                <TaskColorIndicator
                  projectColor={task.projectColor}
                  taskColor={task.taskColor}
                  size={12}
                />
                <View style={styles.legendTextContainer}>
                  <Text style={[styles.legendText, { color: colors.text }]} numberOfLines={1}>
                    {task.taskName}
                  </Text>
                  <Text style={[styles.legendSubtext, { color: colors.text }]} numberOfLines={1}>
                    {task.projectName}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 10,
    width: '100%',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: BAR_GAP,
    width: '100%',
  },
  barDateLabel: {
    width: 64,
    fontSize: 12,
    fontWeight: '500',
    marginRight: 8,
    textAlign: 'right',
    flexShrink: 0,
  },
  labelsContainer: {
    display: 'none',
  },
  labelItem: {},
  barLabel: {},
  chartWrapper: {},
  legendContainer: {
    marginTop: 20,
    width: '100%',
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  legendGrid: {
    flexDirection: 'column',
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginHorizontal: 4,
    width: '100%',
  },
  legendTextContainer: {
    marginLeft: 8,
    flex: 1,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  legendSubtext: {
    fontSize: 9,
    opacity: 0.7,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
}); 