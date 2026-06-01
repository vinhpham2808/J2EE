import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import CustomTooltip from "./CustomTooltip.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

const CustomPieChart = ({ data, label, totalAmount, showTextAnchor, colors, small }) => {
  const { theme } = useTheme();
  return (
    <ResponsiveContainer key={theme} width="100%" height={small ? 240 : 380}>
      <PieChart>
        <Pie
          data={data}
          dataKey="amount"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={small ? 85 : 130}
          innerRadius={small ? 65 : 100}
          paddingAngle={3}
          labelLine={false}
          stroke="transparent"
          strokeWidth={0}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />

        {showTextAnchor && (
          <>
            <text x="50%" y="50%" dy={-14} textAnchor="middle" fill="#94A3B8" fontSize="11px" fontWeight="500">
              {label}
            </text>
            <text x="50%" y="50%" dy={10} textAnchor="middle" fill="#F59E0B" fontSize="18px" fontWeight="800" letterSpacing="-0.5px">
              {totalAmount}
            </text>
          </>
        )}
      </PieChart>
    </ResponsiveContainer>
  );
};

export default CustomPieChart;
