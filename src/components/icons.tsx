import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

type IconProps = { size?: number; color?: string; strokeWidth?: number };

export function BellIcon({ size = 17, color = '#7C6E5F' }: IconProps) {
  const w = size;
  const h = (19 / 17) * size;
  return (
    <Svg width={w} height={h} viewBox="0 0 17 19">
      <Path d="M8.5 1C5 1 3 3.8 3 7v4l-2 3.5h15L14 11V7c0-3.2-2-6-5.5-6z" fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M6.5 17a2 2 0 004 0" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function CameraIcon({ size = 30, color = '#CE8B5C' }: IconProps) {
  const h = (26 / 30) * size;
  return (
    <Svg width={size} height={h} viewBox="0 0 30 26">
      <Rect x={1} y={5} width={28} height={20} rx={4} fill="none" stroke={color} strokeWidth={2} />
      <Path d="M10 5l2-3h6l2 3" fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <Circle cx={15} cy={14} r={5.5} fill="none" stroke={color} strokeWidth={2} />
    </Svg>
  );
}

export function CheckIcon({ size = 14, color = '#43602A', thin }: IconProps & { thin?: boolean }) {
  if (thin) {
    const h = (10 / 13) * size;
    return (
      <Svg width={size} height={h} viewBox="0 0 13 10">
        <Path d="M1 5l3.5 3.5L12 1" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  const h = (11 / 14) * size;
  return (
    <Svg width={size} height={h} viewBox="0 0 14 11">
      <Path d="M1 5.5L5 9.5 13 1" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function MicIcon({ size = 13, color = '#fff' }: IconProps) {
  const h = (18 / 13) * size;
  return (
    <Svg width={size} height={h} viewBox="0 0 13 18">
      <Rect x={4} y={1} width={5} height={10} rx={2.5} fill={color} />
      <Path d="M1.5 8.5a5 5 0 0010 0M6.5 13.5V17" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

export function HomeTabIcon({ size = 20, color = '#E98862', filled = true }: IconProps & { filled?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Path
        d="M3 9l7-6 7 6v8a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 17z"
        fill={filled ? color : 'none'}
        stroke={filled ? 'none' : color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function GrowthTabIcon({ size = 20, color = '#B3A493' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Path d="M2 16L7 9l4 4 7-9" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function HealthTabIcon({ size = 20, color = '#B3A493' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Path
        d="M10 17S3 12.5 3 7.8C3 5.2 5 3.5 7.2 3.5c1.2 0 2.2.6 2.8 1.5.6-.9 1.6-1.5 2.8-1.5C15 3.5 17 5.2 17 7.8 17 12.5 10 17 10 17z"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function BabyTabIcon({ size = 20, color = '#B3A493' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Circle cx={10} cy={7} r={3.5} fill="none" stroke={color} strokeWidth={1.8} />
      <Path d="M3.5 17c.8-3 3.4-4.5 6.5-4.5s5.7 1.5 6.5 4.5" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function PlusIcon({ size = 20, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Path d="M10 3v14M3 10h14" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

export function ChevronLeftIcon({ size = 18, color = '#7C6E5F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18">
      <Path d="M11.5 3.5L6 9l5.5 5.5" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function SmallPlusIcon({ size = 15, color = '#A98F73' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 15 15">
      <Path d="M7.5 2v11M2 7.5h11" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

export function BottleIcon({ size = 22, color = '#C96F4A' }: IconProps) {
  const h = (26 / 22) * size;
  return (
    <Svg width={size} height={h} viewBox="0 0 22 26">
      <Path d="M8 1h6M9 1v4h4V1M7 7c-2 1.5-3 3.5-3 6v9a3 3 0 003 3h8a3 3 0 003-3v-9c0-2.5-1-4.5-3-6z" fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M4 15h14" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

export function SleepIcon({ size = 22, color = '#7B6BA8' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22">
      <Path d="M18.5 13.5A8.5 8.5 0 018.5 3.5a8.5 8.5 0 108 10z" fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    </Svg>
  );
}

export function DiaperIcon({ size = 18, color = '#4E86A0' }: IconProps) {
  const h = (24 / 18) * size;
  return (
    <Svg width={size} height={h} viewBox="0 0 18 24">
      <Path d="M9 1C9 1 2 10 2 15a7 7 0 0014 0C16 10 9 1 9 1z" fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    </Svg>
  );
}

export function SolidsIcon({ size = 24, color = '#6E8F4C' }: IconProps) {
  const h = (20 / 24) * size;
  return (
    <Svg width={size} height={h} viewBox="0 0 24 20">
      <Path d="M2 8h20c0 6-4.5 10-10 10S2 14 2 8z" fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M7 4c1-2 3-2 4 0s3 2 4 0" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function PumpIcon({ size = 22, color = '#B56A7E' }: IconProps) {
  const h = (24 / 22) * size;
  return (
    <Svg width={size} height={h} viewBox="0 0 22 24">
      <Circle cx={11} cy={14} r={8} fill="none" stroke={color} strokeWidth={1.8} />
      <Path d="M11 6V2M7 2h8" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M11 11v3l2.5 1.5" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function MedicineIcon({ size = 20, color = '#A57F2C' }: IconProps) {
  const h = (24 / 20) * size;
  return (
    <Svg width={size} height={h} viewBox="0 0 20 24">
      <Rect x={5} y={1} width={10} height={6} rx={2} fill="none" stroke={color} strokeWidth={1.8} />
      <Rect x={2} y={7} width={16} height={16} rx={4} fill="none" stroke={color} strokeWidth={1.8} />
      <Path d="M10 12v6M7 15h6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function ClockIcon({ size = 18, color = '#A57F2C' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18">
      <Circle cx={9} cy={9} r={7.5} fill="none" stroke={color} strokeWidth={1.8} />
      <Path d="M9 5v4.5l3 2" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function AlertTriangleIcon({ size = 18, color = '#A04E63' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18">
      <Path d="M9 2l7 12H2z" fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M9 7v3.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx={9} cy={12.8} r={1} fill={color} />
    </Svg>
  );
}

export function DueClockIcon({ size = 14, color = '#A57F2C' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14">
      <Circle cx={7} cy={7} r={5.5} fill="none" stroke={color} strokeWidth={1.6} />
      <Path d="M7 4v3l2 1.5" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function InviteIcon({ size = 18, color = '#C96F4A' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18">
      <Circle cx={6} cy={6} r={3} fill="none" stroke={color} strokeWidth={1.8} />
      <Path d="M1.5 15c.6-2.4 2.4-3.5 4.5-3.5s3.9 1.1 4.5 3.5" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M13.5 6v5M11 8.5h5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}
