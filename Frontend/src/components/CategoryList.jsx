import {Pencil, Trash2} from "lucide-react";
import {hasDisplayImage, hideBrokenImageWrapper} from "../util/imageDisplay.js";

const CategoryList = ({categories, onEditCategory, onDeleteCategory}) => {
    return (
        <div className="card p-4">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Nguồn danh mục</h4>
            </div>

            {categories.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400">Chưa có danh mục nào. Hãy thêm danh mục để bắt đầu!</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {categories.map((category) => (
                        <div
                            key={category.id}
                            className="group relative flex items-center gap-4 p-3 rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/5 transition-colors"
                        >
                            {hasDisplayImage(category.icon) ? (
                                <div
                                    data-image-wrapper="true"
                                    className="w-12 h-12 flex shrink-0 items-center justify-center text-xl text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/10 rounded-full"
                                >
                                    <img
                                        src={category.icon}
                                        alt={category.name}
                                        className="h-5 w-5 object-contain"
                                        onError={hideBrokenImageWrapper}
                                    />
                                </div>
                            ) : null}

                            <div className="flex-1 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                        {category.name}
                                    </p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 capitalize">
                                        {category.type === 'income' ? 'Thu nhập' : 'Chi tiêu'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => onEditCategory(category)}
                                        className="text-slate-400 hover:text-violet-500 dark:hover:text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        onClick={() => onDeleteCategory(category)}
                                        className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CategoryList;
