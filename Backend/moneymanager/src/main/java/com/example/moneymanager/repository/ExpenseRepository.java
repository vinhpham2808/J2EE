package com.example.moneymanager.repository;

import com.example.moneymanager.entity.ExpenseEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<ExpenseEntity, Long> {

    //select * from tbl_expenses where profile_id = ?1 order by date desc
    @EntityGraph(attributePaths = {"category", "jar"})
    List<ExpenseEntity> findByProfileIdOrderByDateDesc(Long profileId);

    @EntityGraph(attributePaths = {"category", "jar"})
    Page<ExpenseEntity> findByProfileIdOrderByDateDesc(Long profileId, Pageable pageable);

    //select * from tbl_expenses where profile_id = ?1 order by date desc limit 5
    @EntityGraph(attributePaths = {"category", "jar"})
    List<ExpenseEntity> findTop5ByProfileIdOrderByDateDesc(Long profileId);

    @Query("SELECT SUM(e.amount) FROM ExpenseEntity e WHERE e.profile.id = :profileId")
    BigDecimal findTotalExpenseByProfileId(@Param("profileId") Long profileId);

    @Query("SELECT SUM(e.amount) FROM ExpenseEntity e WHERE e.profile.id = :profileId AND e.date BETWEEN :startDate AND :endDate")
    BigDecimal findTotalExpenseByProfileIdAndDateBetween(@Param("profileId") Long profileId, 
                                                          @Param("startDate") LocalDate startDate, 
                                                          @Param("endDate") LocalDate endDate);

    @Query("SELECT MONTH(e.date), YEAR(e.date), SUM(e.amount) FROM ExpenseEntity e " +
           "WHERE e.profile.id = :profileId AND e.date BETWEEN :startDate AND :endDate " +
           "GROUP BY MONTH(e.date), YEAR(e.date) ORDER BY YEAR(e.date), MONTH(e.date)")
    List<Object[]> findMonthlyExpenseTotals(@Param("profileId") Long profileId, 
                                            @Param("startDate") LocalDate startDate, 
                                            @Param("endDate") LocalDate endDate);

    //select * from tbl_expenses where profile_id = ?1 and date between ?2 and ?3 and name like %?4%
    @EntityGraph(attributePaths = {"category", "jar"})
    List<ExpenseEntity> findByProfileIdAndDateBetweenAndNameContainingIgnoreCase(
            Long profileId,
            LocalDate startDate,
            LocalDate endDate,
            String keyword,
            Sort sort
    );

    @EntityGraph(attributePaths = {"category", "jar"})
    Page<ExpenseEntity> findByProfileIdAndDateBetweenAndNameContainingIgnoreCase(
            Long profileId,
            LocalDate startDate,
            LocalDate endDate,
            String keyword,
            Pageable pageable
    );

    //select * from tbl_expenses where profile_id = ?1 and date between ?2 and ?3
    @EntityGraph(attributePaths = {"category", "jar"})
    List<ExpenseEntity> findByProfileIdAndDateBetween(Long profileId, LocalDate startDate, LocalDate endDate);

    @EntityGraph(attributePaths = {"category", "jar"})
    Page<ExpenseEntity> findByProfileIdAndDateBetween(Long profileId, LocalDate startDate, LocalDate endDate, Pageable pageable);

    //select * from tbl_expenses where profile_id = ?1 and date = ?2
    List<ExpenseEntity> findByProfileIdAndDate(Long profileId, LocalDate date);

    long countByProfileId(Long profileId);

    long countByProfileIdAndDateBetween(Long profileId, LocalDate startDate, LocalDate endDate);

    // Xoá toàn bộ expense thuộc một danh mục (dùng khi xoá danh mục)
    void deleteByCategoryId(Long categoryId);

    void deleteByProfileId(Long profileId);

    List<ExpenseEntity> findByJarId(Long jarId);

    @EntityGraph(attributePaths = {"category", "jar"})
    List<ExpenseEntity> findTop5ByJarIdOrderByDateDesc(Long jarId);

    /**
     * Aggregate query: trả về (categoryName, categoryIcon, totalAmount) theo danh mục
     * trong khoảng thời gian. Tránh load toàn bộ entity và group trong Java.
     */
    @Query("""
            SELECT e.category.name, e.category.icon, SUM(e.amount)
            FROM ExpenseEntity e
            WHERE e.profile.id = :profileId
              AND e.date BETWEEN :startDate AND :endDate
              AND e.category IS NOT NULL
            GROUP BY e.category.name, e.category.icon
            ORDER BY SUM(e.amount) DESC
            """)
    List<Object[]> findCategoryTotalsByProfileIdAndDateBetween(
            @Param("profileId") Long profileId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}
