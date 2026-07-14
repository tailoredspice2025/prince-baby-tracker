import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';
import { Measure, Sex, ageInMonths, valueAtPercentile } from '../lib/percentiles';
import { Measurement } from '../types/models';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const VB_W = 320;
const VB_H = 190;
const PAD_L = 10;
const PAD_R = 10;
const TOP = 8;
const BOTTOM = 150;
const AXIS_Y = 186;

function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M${points[0].x} ${points[0].y}`;
  let d = `M${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const midX = (p0.x + p1.x) / 2;
    d += ` C${midX} ${p0.y} ${midX} ${p1.y} ${p1.x} ${p1.y}`;
  }
  return d;
}

export function GrowthChart({
  measure,
  sex,
  dob,
  measurements,
  valueOf,
  unit,
  showReference = true,
}: {
  measure: Measure;
  sex: Sex;
  dob: string;
  measurements: Measurement[];
  valueOf: (m: Measurement) => number | undefined;
  unit: string;
  /** WHO percentile bands — disabled for v1, planned to return in phase 2. */
  showReference?: boolean;
}) {
  const now = new Date();

  const chart = useMemo(() => {
    const currentMonth = Math.max(1, ageInMonths(dob, now.toISOString()));
    const maxMonth = Math.max(4, Math.ceil(currentMonth) + 1);
    const step = maxMonth / 12;
    const months: number[] = [];
    for (let m = 0; m <= maxMonth; m += step) months.push(m);

    const onDateFor = (m: number) => {
      const d = new Date(dob);
      d.setDate(d.getDate() + Math.round(m * 30.4368));
      return d.toISOString();
    };

    const p15 = showReference ? months.map((m) => valueAtPercentile(measure, sex, 15, dob, onDateFor(m))) : [];
    const p50 = showReference ? months.map((m) => valueAtPercentile(measure, sex, 50, dob, onDateFor(m))) : [];
    const p85 = showReference ? months.map((m) => valueAtPercentile(measure, sex, 85, dob, onDateFor(m))) : [];

    const babyPoints = measurements
      .map((m) => ({ month: ageInMonths(dob, m.date), value: valueOf(m) }))
      .filter((p): p is { month: number; value: number } => p.value !== undefined)
      .sort((a, b) => a.month - b.month);

    const allValues = [...p15, ...p85, ...babyPoints.map((p) => p.value)];
    if (allValues.length === 0) allValues.push(0, 10); // no data yet — arbitrary sane range
    let minV = Math.min(...allValues) * 0.96;
    let maxV = Math.max(...allValues) * 1.04;
    if (maxV - minV < 0.001) {
      // single measurement without bands — pad so scaleY stays finite
      minV -= 1;
      maxV += 1;
    }

    const scaleX = (m: number) => PAD_L + (m / maxMonth) * (VB_W - PAD_L - PAD_R);
    const scaleY = (v: number) => TOP + (1 - (v - minV) / (maxV - minV)) * (BOTTOM - TOP);

    const pts15 = p15.map((v, i) => ({ x: scaleX(months[i]), y: scaleY(v) }));
    const pts50 = p50.map((v, i) => ({ x: scaleX(months[i]), y: scaleY(v) }));
    const pts85 = p85.map((v, i) => ({ x: scaleX(months[i]), y: scaleY(v) }));

    const bandOuterPath = showReference
      ? `${smoothPath(pts85)} L${pts15[pts15.length - 1].x} ${pts15[pts15.length - 1].y} ${smoothPath([...pts15].reverse())
          .replace(/^M/, 'L')} Z`
      : '';
    const bandInnerTopPath = showReference
      ? `${smoothPath(pts85)} L${pts50[pts50.length - 1].x} ${pts50[pts50.length - 1].y} ${smoothPath([...pts50].reverse()).replace(/^M/, 'L')} Z`
      : '';
    const bandInnerBottomPath = showReference
      ? `${smoothPath(pts50)} L${pts15[pts15.length - 1].x} ${pts15[pts15.length - 1].y} ${smoothPath([...pts15].reverse()).replace(/^M/, 'L')} Z`
      : '';

    const babyPixelPoints = babyPoints.map((p) => ({ x: scaleX(p.month), y: scaleY(p.value) }));
    const babyLinePath = smoothPath(babyPixelPoints);

    // approximate curve length for the dash-offset draw-in animation
    let approxLength = 0;
    for (let i = 0; i < babyPixelPoints.length - 1; i++) {
      const a = babyPixelPoints[i];
      const b = babyPixelPoints[i + 1];
      approxLength += Math.hypot(b.x - a.x, b.y - a.y);
    }
    approxLength *= 1.15; // beziers bow slightly beyond the chord length

    return {
      maxMonth,
      bandOuterPath,
      bandInnerTopPath,
      bandInnerBottomPath,
      line15: smoothPath(pts15),
      line50: smoothPath(pts50),
      line85: smoothPath(pts85),
      babyLinePath,
      babyPixelPoints,
      approxLength,
      lastLabel: babyPoints.length ? `${babyPoints[babyPoints.length - 1].value}${unit}` : '',
    };
  }, [measure, sex, dob, measurements, valueOf, unit, showReference]);

  // draw-in on tab switch: ~500ms ease-out per the design spec
  const drawAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    drawAnim.setValue(0);
    Animated.timing(drawAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [measure]);

  const dashOffset = drawAnim.interpolate({ inputRange: [0, 1], outputRange: [chart.approxLength, 0] });
  const dotOpacity = drawAnim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0, 0, 1] });

  return (
    <View>
      <Svg width="100%" height={190} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        {showReference && (
          <>
            <Path d={chart.bandOuterPath} fill="#F6E7D8" />
            <Path d={chart.bandInnerBottomPath} fill="#EFD9C2" />
            <Path d={chart.line85} fill="none" stroke="#E5CBAA" strokeWidth={1} strokeDasharray="3 4" />
            <Path d={chart.line50} fill="none" stroke="#DDBE96" strokeWidth={1} strokeDasharray="3 4" />
            <Path d={chart.line15} fill="none" stroke="#E5CBAA" strokeWidth={1} strokeDasharray="3 4" />
            <SvgText x={VB_W - 6} y={TOP + 4} fontSize={9} fill="#C4A87F" textAnchor="end">85th</SvgText>
            <SvgText x={VB_W - 6} y={TOP + 30} fontSize={9} fill="#B08F60" textAnchor="end">50th</SvgText>
            <SvgText x={VB_W - 6} y={TOP + 58} fontSize={9} fill="#C4A87F" textAnchor="end">15th</SvgText>
          </>
        )}

        <AnimatedPath
          d={chart.babyLinePath}
          fill="none"
          stroke="#E98862"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={`${chart.approxLength}`}
          strokeDashoffset={dashOffset as unknown as number}
        />
        {chart.babyPixelPoints.map((p, i) => {
          const isLast = i === chart.babyPixelPoints.length - 1;
          return (
            <AnimatedCircle
              key={i}
              cx={p.x}
              cy={p.y}
              r={isLast ? 5.5 : 4}
              fill={isLast ? '#E98862' : '#fff'}
              stroke={isLast ? '#fff' : '#E98862'}
              strokeWidth={2.5}
              opacity={dotOpacity as unknown as number}
            />
          );
        })}

        <SvgText x={10} y={AXIS_Y} fontSize={10} fill="#B39F8D">Birth</SvgText>
        <SvgText x={VB_W / 2 - 10} y={AXIS_Y} fontSize={10} fill="#B39F8D">{Math.round(chart.maxMonth / 2)} mo</SvgText>
        <SvgText x={VB_W - 40} y={AXIS_Y} fontSize={10} fill="#B39F8D">{Math.round(chart.maxMonth)} mo</SvgText>
      </Svg>
    </View>
  );
}
