import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useUser } from "../hooks/useUser.jsx";
import axiosConfig from "../util/axiosConfig.jsx";
import { API_ENDPOINTS } from "../util/apiEndpoints.js";
import Dashboard from "../components/Dashboard.jsx";
import SavingGoalList from "../components/SavingGoalList.jsx";
import SavingGoalForm from "../components/SavingGoalForm.jsx";
import ContributionModal from "../components/ContributionModal.jsx";
import Modal from "../components/Modal.jsx";
import DeleteAlert from "../components/DeleteAlert.jsx";
import { usePageTitle } from "../hooks/usePageTitle.js";

const SavingGoals = () => {
  useUser();
  usePageTitle("Mục tiêu tiết kiếm");

  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editGoal, setEditGoal] = useState(null);
  const [deleteAlert, setDeleteAlert] = useState({ show: false, id: null });
  const [contributionGoal, setContributionGoal] = useState(null);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await axiosConfig.get(API_ENDPOINTS.GET_SAVING_GOALS);
      if (res.data) setGoals(res.data);
    } catch (err) {
      console.error("Lỗi tải mục tiêu:", err);
      toast.error("Không thể tải danh sách mục tiêu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGoals(); }, []);

  const handleCreateGoal = async (dto) => {
    try {
      await axiosConfig.post(API_ENDPOINTS.ADD_SAVING_GOAL, dto);
      toast.success("Tạo mục tiêu thành công!");
      setShowAddModal(false);
      fetchGoals();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể tạo mục tiêu.");
    }
  };

  const handleUpdateGoal = async (dto) => {
    try {
      await axiosConfig.put(API_ENDPOINTS.UPDATE_SAVING_GOAL(editGoal.id), dto);
      toast.success("Cập nhật mục tiêu thành công!");
      setEditGoal(null);
      fetchGoals();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể cập nhật mục tiêu.");
    }
  };

  const handleDeleteGoal = async (id) => {
    try {
      await axiosConfig.delete(API_ENDPOINTS.DELETE_SAVING_GOAL(id));
      toast.success("Đã huỷ mục tiêu.");
      setDeleteAlert({ show: false, id: null });
      fetchGoals();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể huỷ mục tiêu.");
    }
  };

  const handleContribute = async (goalId, dto) => {
    try {
      await axiosConfig.post(API_ENDPOINTS.ADD_SAVING_GOAL_CONTRIBUTION(goalId), dto);
      toast.success("Đóng góp thành công!");
      fetchGoals();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể đóng góp.");
      return false;
    }
  };

  return (
    <Dashboard activeMenu="SavingGoals">
      <div className="space-y-6">
        <SavingGoalList
          goals={goals}
          loading={loading}
          onAddClick={() => setShowAddModal(true)}
          onEdit={(goal) => setEditGoal(goal)}
          onDelete={(id) => setDeleteAlert({ show: true, id })}
          onContribute={(goal) => setContributionGoal(goal)}
        />

        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Tạo mục tiêu tiết kiệm">
          <SavingGoalForm key="create-goal" onSave={handleCreateGoal} onCancel={() => setShowAddModal(false)} />
        </Modal>

        <Modal isOpen={!!editGoal} onClose={() => setEditGoal(null)} title="Cập nhật mục tiêu">
          <SavingGoalForm key={editGoal?.id || "edit-goal"} initialData={editGoal} isEditing={true} onSave={handleUpdateGoal} onCancel={() => setEditGoal(null)} />
        </Modal>

        <Modal isOpen={deleteAlert.show} onClose={() => setDeleteAlert({ show: false, id: null })} title="Huỷ mục tiêu">
          <DeleteAlert
            content="Bạn có chắc muốn huỷ mục tiêu này không? Mục tiêu sẽ chuyển sang trạng thái đã huỷ."
            onDelete={() => handleDeleteGoal(deleteAlert.id)}
            onCancel={() => setDeleteAlert({ show: false, id: null })}
          />
        </Modal>

        {contributionGoal && (
          <ContributionModal goal={contributionGoal} onClose={() => setContributionGoal(null)} onContribute={handleContribute} />
        )}
      </div>
    </Dashboard>
  );
};

export default SavingGoals;
