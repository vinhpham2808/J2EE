package com.example.moneymanager.repository;

import com.example.moneymanager.entity.PaymentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<PaymentEntity, Long> {

    Optional<PaymentEntity> findByOrderCode(Long orderCode);

    boolean existsByOrderCode(Long orderCode);

    Optional<PaymentEntity> findByPaymentLinkId(String paymentLinkId);

    List<PaymentEntity> findByStatusIn(List<String> statuses);

    @Query("SELECT p FROM PaymentEntity p LEFT JOIN FETCH p.profile ORDER BY p.createdAt DESC")
    List<PaymentEntity> findAllWithProfileOrderByCreatedAtDesc();

    @Query("SELECT p FROM PaymentEntity p LEFT JOIN FETCH p.profile WHERE LOWER(p.status) = LOWER(:status) ORDER BY p.createdAt DESC")
    List<PaymentEntity> findByStatusWithProfileOrderByCreatedAtDesc(@Param("status") String status);

    long countByStatusIgnoreCase(String status);

    List<PaymentEntity> findByProfileIdOrderByCreatedAtDesc(Long profileId);

    void deleteByProfileId(Long profileId);
}
