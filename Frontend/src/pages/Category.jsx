import Dashboard from "../components/Dashboard.jsx";
import { useUser } from "../hooks/useUser.jsx";
import { Plus } from "lucide-react";
import CategoryList from "../components/CategoryList.jsx";
import { useEffect, useState } from "react";
import axiosConfig from "../util/axiosConfig.jsx";
import { API_ENDPOINTS } from "../util/apiEndpoints.js";
import toast from "react-hot-toast";
import Modal from "../components/Modal.jsx";
import AddCategoryForm from "../components/AddCategoryForm.jsx";
import DeleteAlert from "../components/DeleteAlert.jsx";
import { usePageTitle } from "../hooks/usePageTitle.js";

const Category = () => {
  useUser();
  usePageTitle("Danh mục");
  const [loading, setLoading] = useState(false);
  const [categoryData, setCategoryData] = useState([]);
  const [openAddCategoryModal, setOpenAddCategoryModal] = useState(false);
  const [openEditCategoryModal, setOpenEditCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [openDeleteAlert, setOpenDeleteAlert] = useState({ show: false, id: null, name: "" });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategoryDetails = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await axiosConfig.get(API_ENDPOINTS.GET_ALL_CATEGORIES);
      if (response.status === 200) setCategoryData(response.data);
    } catch (error) {
      console.error("Something went wrong. Please try again.", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategoryDetails(); }, []);

  const handleAddCategory = async (category) => {
    const { name, type, icon } = category;
    if (!name.trim()) { toast.error("Category Name is required"); return; }
    const isDuplicate = categoryData.some((c) => c.name.toLowerCase() === name.trim().toLowerCase());
    if (isDuplicate) { toast.error("Category Name already exists"); return; }
    try {
      const response = await axiosConfig.post(API_ENDPOINTS.ADD_CATEGORY, { name, type, icon });
      if (response.status === 201) {
        toast.success("Thêm danh mục thành công");
        setOpenAddCategoryModal(false);
        fetchCategoryDetails();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add category.");
    }
  };

  const handleEditCategory = (categoryToEdit) => {
    setSelectedCategory(categoryToEdit);
    setOpenEditCategoryModal(true);
  };

  const handleUpdateCategory = async (updatedCategory) => {
    const { id, name, type, icon } = updatedCategory;
    if (!name.trim()) { toast.error("Category Name is required"); return; }
    if (!id) { toast.error("Category ID is missing for update"); return; }
    try {
      await axiosConfig.put(API_ENDPOINTS.UPDATE_CATEGORY(id), { name, type, icon });
      setOpenEditCategoryModal(false);
      setSelectedCategory(null);
      toast.success("Cập nhật danh mục thành công");
      fetchCategoryDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update category.");
    }
  };

  // Mở confirm dialog xoá
  const handleDeleteCategory = (category) => {
    setOpenDeleteAlert({ show: true, id: category.id, name: category.name });
  };

  // Thực sự gọi API xoá
  const confirmDeleteCategory = async () => {
    if (!openDeleteAlert.id) return;
    setIsDeleting(true);
    try {
      await axiosConfig.delete(API_ENDPOINTS.DELETE_CATEGORY(openDeleteAlert.id));
      toast.success(`Đã xoá danh mục "${openDeleteAlert.name}"`);
      setOpenDeleteAlert({ show: false, id: null, name: "" });
      fetchCategoryDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể xoá danh mục. Vui lòng thử lại.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dashboard activeMenu="Category">
      <div className="space-y-5">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tất cả danh mục</h2>
          <button
            onClick={() => setOpenAddCategoryModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold
              bg-violet-600 hover:bg-violet-500 text-white transition-all duration-150 active:scale-95"
          >
            <Plus size={15} />Thêm danh mục
          </button>
        </div>

        <CategoryList
          categories={categoryData}
          onEditCategory={handleEditCategory}
          onDeleteCategory={handleDeleteCategory}
        />

        {/* Modal thêm danh mục */}
        <Modal isOpen={openAddCategoryModal} onClose={() => setOpenAddCategoryModal(false)} title="Thêm danh mục">
          <AddCategoryForm onAddCategory={handleAddCategory} />
        </Modal>

        {/* Modal sửa danh mục */}
        <Modal
          onClose={() => { setOpenEditCategoryModal(false); setSelectedCategory(null); }}
          isOpen={openEditCategoryModal}
          title="Cập nhật danh mục"
        >
          <AddCategoryForm initialCategoryData={selectedCategory} onAddCategory={handleUpdateCategory} isEditing={true} />
        </Modal>

        {/* Modal xác nhận xoá */}
        <Modal
          isOpen={openDeleteAlert.show}
          onClose={() => !isDeleting && setOpenDeleteAlert({ show: false, id: null, name: "" })}
          title="⚠️ Xoá danh mục"
        >
          <DeleteAlert
            content={`Bạn có chắc chắn muốn xoá danh mục "${openDeleteAlert.name}"?\n\n⚠️ Toàn bộ giao dịch (thu nhập / chi tiêu) thuộc danh mục này cũng sẽ bị xoá vĩnh viễn và không thể khôi phục.`}
            onDelete={confirmDeleteCategory}
          />
        </Modal>
      </div>
    </Dashboard>
  );
};

export default Category;
