package com.example.moneymanager.repository;

import com.example.moneymanager.entity.BudgetEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface BudgetRepository extends JpaRepository<BudgetEntity, Long> {

    // Tìm hạn mức theo profile, category, tháng, năm
    Optional<BudgetEntity> findByProfileIdAndCategoryIdAndMonthAndYear(
            Long profileId, Long categoryId, Integer month, Integer year
    );

    // Lấy tất cả hạn mức của profile trong tháng/năm
    List<BudgetEntity> findByProfileIdAndMonthAndYear(Long profileId, Integer month, Integer year);

    // Lấy tất cả hạn mức của profile
    List<BudgetEntity> findByProfileIdOrderByYearDescMonthDesc(Long profileId);

    // Tính tổng chi tiêu theo profile, category, tháng, năm từ bảng expenses
    @Query("""
            SELECT COALESCE(SUM(e.amount), 0)
            FROM ExpenseEntity e
            WHERE e.profile.id = :profileId
              AND e.category.id = :categoryId
              AND MONTH(e.date) = :month
              AND YEAR(e.date) = :year
            """)
    BigDecimal getTotalSpentByProfileAndCategoryAndMonthAndYear(
            @Param("profileId") Long profileId,
            @Param("categoryId") Long categoryId,
            @Param("month") Integer month,
            @Param("year") Integer year
    );

    // Batch: lấy tổng chi tiêu cho tất cả danh mục của profile trong tháng/năm (tránh N+1)
    @Query("""
            SELECT e.category.id, COALESCE(SUM(e.amount), 0)
            FROM ExpenseEntity e
            WHERE e.profile.id = :profileId
              AND MONTH(e.date) = :month
              AND YEAR(e.date) = :year
            GROUP BY e.category.id
            """)
    List<Object[]> getTotalSpentByCategoryForProfileAndMonth(
            @Param("profileId") Long profileId,
            @Param("month") Integer month,
            @Param("year") Integer year
    );

    // Xoá toàn bộ budget thuộc một danh mục (dùng khi xoá danh mục)
    void deleteByCategoryId(Long categoryId);

    void deleteByProfileId(Long profileId);
}
