import React from 'react';
import { View } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';

const VB_W = 320;
const BAR_AREA_H = 96;
const LABEL_H = 16;
const VB_H = BAR_AREA_H + LABEL_H;
const PAD_X = 4;

/**
 * Compact rounded-bar chart for the Trends screen. The last bar (today /
 * this month) is drawn at full strength, earlier bars slightly faded —
 * same emphasis pattern as the Growth chart's latest data point.
 * `labels[i] = null` hides that tick so dense ranges stay legible.
 */
export function TrendBarChart({
  values,
  labels,
  color,
  fadedColor,
  onBarPress,
}: {
  values: number[];
  labels: (string | null)[];
  color: string;
  fadedColor: string;
  onBarPress?: (index: number) => void;
}) {
  const n = values.length;
  if (n === 0) return null;
  const max = Math.max(...values, 1);
  const innerW = VB_W - PAD_X * 2;
  const slot = innerW / n;
  const barW = Math.min(slot * 0.62, 26);
  const avg = values.reduce((a, b) => a + b, 0) / n;
  const avgY = BAR_AREA_H - (avg / max) * (BAR_AREA_H - 8);

  return (
    <View>
      <Svg width="100%" height={130} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <Line x1={PAD_X} y1={BAR_AREA_H} x2={VB_W - PAD_X} y2={BAR_AREA_H} stroke="#EFE3D2" strokeWidth={1} />
        {avg > 0 && (
          <Line
            x1={PAD_X}
            y1={avgY}
            x2={VB_W - PAD_X}
            y2={avgY}
            stroke="#D8C6AE"
            strokeWidth={1}
            strokeDasharray="3 4"
          />
        )}
        {values.map((v, i) => {
          const h = v <= 0 ? 2 : Math.max(3, (v / max) * (BAR_AREA_H - 8));
          const x = PAD_X + i * slot + (slot - barW) / 2;
          const isLast = i === n - 1;
          return (
            <Rect
              key={i}
              x={x}
              y={BAR_AREA_H - h}
              width={barW}
              height={h}
              rx={Math.min(barW / 2, 5)}
              fill={v <= 0 ? '#EFE3D2' : isLast ? color : fadedColor}
            />
          );
        })}
        {onBarPress &&
          values.map((_, i) => (
            // invisible full-height touch strip — bars themselves are too
            // thin a target in month view
            <Rect
              key={`touch-${i}`}
              x={PAD_X + i * slot}
              y={0}
              width={slot}
              height={BAR_AREA_H}
              fill="transparent"
              onPress={() => onBarPress(i)}
            />
          ))}
        {labels.map((label, i) =>
          label == null ? null : (
            <SvgText
              key={i}
              x={PAD_X + i * slot + slot / 2}
              y={VB_H - 3}
              fontSize={9}
              fill="#B39F8D"
              textAnchor="middle"
            >
              {label}
            </SvgText>
          )
        )}
      </Svg>
    </View>
  );
}
