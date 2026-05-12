import { GripVertical } from "lucide-react";

const WidgetWrapper = ({ editMode, isDragging, dragHandleProps, children }) => {
  return (
    <div
      className={`relative rounded-2xl transition-all duration-200 ${
        isDragging ? "opacity-60 shadow-2xl z-50 ring-2 ring-amber-500/40" : ""
      }`}
    >
      {/* Drag handle */}
      {editMode && (
        <div
          {...dragHandleProps}
          className="absolute top-3 left-3 z-10 p-1.5 rounded-lg cursor-grab active:cursor-grabbing
            bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-slate-500
            hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-200 dark:hover:bg-white/20
            transition-colors"
        >
          <GripVertical size={16} />
        </div>
      )}
      {children}
    </div>
  );
};

export default WidgetWrapper;
