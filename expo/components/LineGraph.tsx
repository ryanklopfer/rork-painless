import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import Colors from '@/constants/colors';

interface DataPoint {
  label: string;
  value: number;
}

interface LineGraphProps {
  data: DataPoint[];
  color: string;
  title: string;
  suffix?: string;
  maxValue?: number;
  height?: number;
}

export default function LineGraph({
  data,
  color,
  title,
  suffix = '',
  maxValue: propMax,
  height = 140,
}: LineGraphProps) {
  const [containerWidth, setContainerWidth] = useState<number>(0);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  const paddingLeft = 32;
  const paddingRight = 16;
  const paddingTop = 16;
  const paddingBottom = 28;
  const graphWidth = containerWidth > 0 ? containerWidth - 24 : 300;
  const graphHeight = height;
  const drawWidth = graphWidth - paddingLeft - paddingRight;
  const drawHeight = graphHeight - paddingTop - paddingBottom;

  const { path, fillPath, points, maxVal, minVal, yLabels } = useMemo(() => {
    if (data.length === 0) {
      return { path: '', fillPath: '', points: [], maxVal: 10, minVal: 0, yLabels: [] as number[] };
    }

    const values = data.map(d => d.value);
    const rawMax = propMax ?? Math.max(...values);
    const rawMin = Math.min(...values);
    const range = rawMax - rawMin;
    const maxV = rawMax + (range > 0 ? range * 0.1 : 1);
    const minV = Math.max(0, rawMin - (range > 0 ? range * 0.1 : 0));

    const step = data.length > 1 ? drawWidth / (data.length - 1) : 0;

    const pts = data.map((d, i) => ({
      x: paddingLeft + i * step,
      y: paddingTop + drawHeight - ((d.value - minV) / (maxV - minV)) * drawHeight,
      value: d.value,
      label: d.label,
    }));

    let linePath = '';
    let areaPath = '';

    if (pts.length === 1) {
      linePath = `M${pts[0].x},${pts[0].y}`;
      areaPath = `M${pts[0].x},${paddingTop + drawHeight} L${pts[0].x},${pts[0].y} L${pts[0].x},${paddingTop + drawHeight}Z`;
    } else {
      linePath = `M${pts[0].x},${pts[0].y}`;
      areaPath = `M${pts[0].x},${paddingTop + drawHeight} L${pts[0].x},${pts[0].y}`;

      for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1];
        const curr = pts[i];
        const cpx1 = prev.x + (curr.x - prev.x) * 0.4;
        const cpx2 = curr.x - (curr.x - prev.x) * 0.4;
        linePath += ` C${cpx1},${prev.y} ${cpx2},${curr.y} ${curr.x},${curr.y}`;
        areaPath += ` C${cpx1},${prev.y} ${cpx2},${curr.y} ${curr.x},${curr.y}`;
      }

      areaPath += ` L${pts[pts.length - 1].x},${paddingTop + drawHeight}Z`;
    }

    const yLabelCount = 3;
    const yLbls: number[] = [];
    for (let i = 0; i < yLabelCount; i++) {
      yLbls.push(Math.round(minV + ((maxV - minV) * i) / (yLabelCount - 1)));
    }

    return { path: linePath, fillPath: areaPath, points: pts, maxVal: maxV, minVal: minV, yLabels: yLbls };
  }, [data, propMax, drawWidth, drawHeight]);

  if (data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={[styles.emptyGraph, { height: graphHeight }]}>
          <Text style={styles.emptyText}>No data yet</Text>
        </View>
      </View>
    );
  }

  const gridLines = yLabels.map(val => ({
    y: paddingTop + drawHeight - ((val - minVal) / (maxVal - minVal)) * drawHeight,
    label: val,
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.graphCard} onLayout={onLayout}>
        <Svg width={graphWidth} height={graphHeight} viewBox={`0 0 ${graphWidth} ${graphHeight}`}>
          <Defs>
            <LinearGradient id={`grad_${title}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity="0.25" />
              <Stop offset="1" stopColor={color} stopOpacity="0.02" />
            </LinearGradient>
          </Defs>

          {gridLines.map((gl, i) => (
            <React.Fragment key={i}>
              <Line
                x1={paddingLeft}
                y1={gl.y}
                x2={graphWidth - paddingRight}
                y2={gl.y}
                stroke={Colors.borderLight}
                strokeWidth={1}
                strokeDasharray="4,4"
              />
              <Rect x={0} y={gl.y - 7} width={28} height={14} fill="transparent" />
            </React.Fragment>
          ))}

          <Path d={fillPath} fill={`url(#grad_${title})`} />
          <Path d={path} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />

          {points.map((pt, i) => (
            <Circle key={i} cx={pt.x} cy={pt.y} r={4} fill={color} stroke={Colors.surface} strokeWidth={2} />
          ))}
        </Svg>

        <View style={[styles.yLabelsContainer, { height: graphHeight }]}>
          {gridLines.map((gl, i) => (
            <Text key={i} style={[styles.yLabel, { top: gl.y - 6 }]}>
              {gl.label}{suffix}
            </Text>
          ))}
        </View>

        <View style={[styles.xLabelsContainer, { left: paddingLeft, width: drawWidth }]}>
          {points.length <= 10 ? points.map((pt, i) => (
            <Text
              key={i}
              style={[styles.xLabel, {
                position: 'absolute' as const,
                left: pt.x - paddingLeft - 14,
                width: 28,
                textAlign: 'center' as const,
              }]}
            >
              {pt.label}
            </Text>
          )) : (
            <>
              <Text style={[styles.xLabel, { position: 'absolute' as const, left: -14, width: 28, textAlign: 'center' as const }]}>
                {points[0]?.label}
              </Text>
              <Text style={[styles.xLabel, { position: 'absolute' as const, left: drawWidth - 14, width: 28, textAlign: 'center' as const }]}>
                {points[points.length - 1]?.label}
              </Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  graphCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 12,
    paddingBottom: 20,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative' as const,
    overflow: 'hidden',
  },
  yLabelsContainer: {
    position: 'absolute' as const,
    left: 12,
    top: 12,
    width: 30,
  },
  yLabel: {
    position: 'absolute' as const,
    fontSize: 10,
    color: Colors.textTertiary,
    fontWeight: '500' as const,
  },
  xLabelsContainer: {
    position: 'absolute' as const,
    bottom: 4,
    height: 16,
  },
  xLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontWeight: '500' as const,
  },
  emptyGraph: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
});
