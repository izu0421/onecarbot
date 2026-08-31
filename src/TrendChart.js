// Composite score over time. Watching the trend is the point of the app —
// a single session number is noisy enough to be close to meaningless.
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import { colors, space, type } from './theme';

const HEIGHT = 170;
const PAD = { top: 12, right: 10, bottom: 22, left: 26 };

function shortDate(d) {
  return d ? d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '';
}

/**
 * @param {{points: {score:number, at:Date|null}[]}} props  oldest first
 */
export default function TrendChart({ points }) {
  const [width, setWidth] = useState(0);

  // One point is not a trend. Say so rather than drawing a lonely dot.
  if (!points || points.length < 2) {
    return (
      <View style={styles.empty}>
        <Text style={type.small}>
          {points?.length === 1
            ? 'One more session and your trend appears here.'
            : 'Your trend appears here after two sessions.'}
        </Text>
      </View>
    );
  }

  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = HEIGHT - PAD.top - PAD.bottom;

  // Fixed 0–100 scale. An auto-scaled axis makes normal week-to-week wobble
  // look like a dramatic decline, which is exactly the wrong thing to show.
  const x = (i) => PAD.left + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const y = (score) => PAD.top + plotH - (Math.max(0, Math.min(100, score)) / 100) * plotH;

  const polyline = points.map((p, i) => `${x(i)},${y(p.score)}`).join(' ');
  const last = points[points.length - 1];

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 ? (
        <Svg width={width} height={HEIGHT}>
          {[0, 50, 100].map((tick) => (
            <React.Fragment key={tick}>
              <Line
                x1={PAD.left}
                y1={y(tick)}
                x2={width - PAD.right}
                y2={y(tick)}
                stroke={colors.border}
                strokeWidth={1}
              />
              <SvgText
                x={PAD.left - 6}
                y={y(tick) + 4}
                fontSize={10}
                fill={colors.textFaint}
                textAnchor="end"
              >
                {tick}
              </SvgText>
            </React.Fragment>
          ))}

          <Polyline
            points={polyline}
            fill="none"
            stroke={colors.accent}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {points.map((p, i) => (
            <Circle
              key={i}
              cx={x(i)}
              cy={y(p.score)}
              r={i === points.length - 1 ? 4.5 : 2.5}
              fill={i === points.length - 1 ? colors.accent : colors.surface}
              stroke={colors.accent}
              strokeWidth={1.5}
            />
          ))}

          <SvgText x={PAD.left} y={HEIGHT - 6} fontSize={10} fill={colors.textFaint}>
            {shortDate(points[0].at)}
          </SvgText>
          <SvgText
            x={width - PAD.right}
            y={HEIGHT - 6}
            fontSize={10}
            fill={colors.textFaint}
            textAnchor="end"
          >
            {shortDate(last.at)}
          </SvgText>
        </Svg>
      ) : (
        <View style={{ height: HEIGHT }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    height: HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.md,
  },
});
