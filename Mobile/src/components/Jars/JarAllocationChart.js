import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { G, Path, Text as SvgText } from "react-native-svg";
import { COLORS, useAppColors } from "../../constants/colors";
import { describeDonutArc } from "../../utils/jar";

const outerR = 75;
const innerR = 50;
const padding = 15;
const svgSize = (outerR + padding) * 2;
const cx = svgSize / 2;
const cy = svgSize / 2;

export default function JarAllocationChart({ jarCount, slices }) {
  const colors = useAppColors();

  if (!slices.length) return null;

  return (
    <View style={[styles.chartCard, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER }]}> 
      <Text style={[styles.chartTitle, { color: colors.TEXT }]}>Cơ cấu tài sản thực tế</Text>
      <View style={styles.chartWrapper}>
        <Svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
          <G>
            {slices.map((slice) => (
              <Path key={slice.key} d={describeDonutArc(cx, cy, outerR, innerR, slice.startAngle, slice.endAngle)} fill={slice.color} />
            ))}
            <SvgText x={cx} y={cy - 6} textAnchor="middle" fontSize="11" fontWeight="600" fill={colors.TEXT_SECONDARY}>Ví hũ</SvgText>
            <SvgText x={cx} y={cy + 12} textAnchor="middle" fontSize="14" fontWeight="800" fill={colors.PRIMARY}>{jarCount} Hũ</SvgText>
          </G>
        </Svg>
        <View style={styles.chartLegend}>
          {slices.slice(0, 5).map((slice) => (
            <View key={slice.key} style={styles.legendItem}>
              <View style={[styles.legendColorBox, { backgroundColor: slice.color }]} />
              <Text style={[styles.legendText, { color: colors.TEXT_SECONDARY }]} numberOfLines={1}>{slice.name} ({slice.percent.toFixed(1)}%)</Text>
            </View>
          ))}
          {slices.length > 5 && <Text style={[styles.moreLegendText, { color: colors.TEXT_MUTED }]}>và {slices.length - 5} hũ khác...</Text>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartCard: 
  { 
    backgroundColor: COLORS.WHITE, 
    borderRadius: 18, 
    borderWidth: 1, 
    borderColor: COLORS.CARD_BORDER, 
    padding: 14, 
    marginBottom: 12 
  },
  chartTitle: 
  { 
    fontSize: 14, 
    fontWeight: "800", 
    color: COLORS.TEXT, 
    marginBottom: 10 
  },
  chartWrapper: 
  { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between" 
  },
  chartLegend: 
  { flex: 1, 
    marginLeft: 16, 
    gap: 6 
  },
  legendItem: 
  { 
    flexDirection: "row", 
    alignItems: "center" 
  },
  legendColorBox: 
  { width: 10, 
    height: 10, 
    borderRadius: 3, 
    marginRight: 6 
  },
  legendText: 
  { 
    fontSize: 11, 
    color: COLORS.TEXT_SECONDARY, 
    fontWeight: "600", 
    flex: 1 
  },
  moreLegendText: 
  { fontSize: 10, 
    color: COLORS.TEXT_MUTED, 
    fontStyle: "italic", 
    marginTop: 2 
  }
});
