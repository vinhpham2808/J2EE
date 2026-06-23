import {useEffect, useState} from "react";
import Input from "./Input.jsx";
import EmojiPickerPopup from "./EmojiPickerPopup.jsx";
import {LoaderCircle} from "lucide-react";

const AddCategoryForm = ({onAddCategory, initialCategoryData, isEditing}) => {
    const [category, setCategory] = useState({
        name: "",
        type: "income",
        icon: ""
    })
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEditing && initialCategoryData) {
            setCategory(initialCategoryData);
        } else {
            setCategory({name: "", type: "income", icon: ""});
        }
    }, [isEditing, initialCategoryData]);

    const categoryTypeOptions = [
        {value: "income", label: "Thu nhập"},
        {value: "expense", label: "Chi tiêu"},
    ]

    const handleChange = (key, value) => {
        setCategory(prev => ({...prev, [key]: value}))
    }

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await onAddCategory(category);
        }finally {
            setLoading(false);
        }
    }
    return (
        <div className="p-4">

            <EmojiPickerPopup
                icon={category.icon}
                onSelect={(selectedIcon) => handleChange("icon", selectedIcon)}
            />

            <Input
                value={category.name}
                onChange={({target}) => handleChange("name", target.value)}
                label="Tên danh mục"
                placeholder="VD: Lương, Siêu thị"
                type="text"
            />

            <Input
                label="Loại danh mục"
                value={category.type}
                onChange={({target}) => handleChange("type", target.value)}
                isSelect={true}
                options={categoryTypeOptions}
            />

            <div className="flex justify-end mt-6">
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="add-btn add-btn-fill">
                    {loading ? (
                        <>
                            <LoaderCircle className="w-4 h-4 animate-spin"/>
                            {isEditing ? "Đang cập nhật..." : "Đang thêm..."}
                        </>
                    ): (
                        <>
                            {isEditing ? "Cập nhật danh mục" : "Thêm danh mục"}
                        </>
                    )}
                </button>
            </div>
        </div>

    )
}

export default AddCategoryForm;