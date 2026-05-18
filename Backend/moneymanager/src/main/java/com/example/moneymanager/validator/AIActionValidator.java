package com.example.moneymanager.validator;

import com.example.moneymanager.entity.ProfileEntity;
import com.example.moneymanager.repository.CategoryRepository;
import com.example.moneymanager.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class AIActionValidator {

    private final CategoryRepository categoryRepository;
    private final SubscriptionService subscriptionService;

    public List<String> validate(String intent, Map<String, Object> data, ProfileEntity profile) {
        List<String> errors = new ArrayList<>();

        if (intent == null || intent.isBlank()) {
            errors.add("Intent không được để trống.");
            return errors;
        }

        validateBySubscription(intent, profile, errors);
        validateByIntentType(intent, data, profile, errors);

        return errors;
    }

    private void validateBySubscription(String intent, ProfileEntity profile, List<String> errors) {
        SubscriptionService.PlanFeatures features = subscriptionService.getPlanFeatures(profile);

        boolean isCrud = intent.startsWith("CREATE_") || intent.startsWith("UPDATE_") || intent.startsWith("DELETE_");
        if (!isCrud) return;

        if (features.getPlan() == com.example.moneymanager.entity.SubscriptionPlan.FREE) {
            if (intent.contains("BUDGET") || intent.contains("SAVING_GOAL")) {
                errors.add("Tính năng này yêu cầu gói BASIC trở lên. Vui lòng nâng cấp.");
            }
            if (intent.startsWith("DELETE_")) {
                errors.add("Gói FREE không hỗ trợ xóa dữ liệu. Vui lòng nâng cấp.");
            }
        }
    }

    private void validateByIntentType(String intent, Map<String, Object> data, ProfileEntity profile, List<String> errors) {
        switch (intent) {
            case "CREATE_EXPENSE", "UPDATE_EXPENSE" -> {
                validateAmount(data, errors);
                validateCategory(data, profile, errors);
                validateDate(data, errors, false);
            }
            case "CREATE_INCOME", "UPDATE_INCOME" -> {
                validateAmount(data, errors);
                validateDate(data, errors, false);
            }
            case "CREATE_CATEGORY" -> validateCategoryName(data, profile, errors);
            case "CREATE_BUDGET", "UPDATE_BUDGET" -> {
                validateAmount(data, errors);
                validateCategory(data, profile, errors);
            }
            case "CREATE_SAVING_GOAL" -> {
                validateName(data, errors);
                validateTargetAmount(data, errors);
            }
            case "DELETE_EXPENSE", "DELETE_CATEGORY" -> {} // handled by service
        }
    }

    private void validateAmount(Map<String, Object> data, List<String> errors) {
        Object amountObj = data.get("amount");
        if (amountObj == null) {
            errors.add("Vui lòng nhập số tiền.");
            return;
        }
        try {
            BigDecimal amount = new BigDecimal(amountObj.toString());
            if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                errors.add("Số tiền phải lớn hơn 0.");
            }
        } catch (NumberFormatException e) {
            errors.add("Số tiền không hợp lệ.");
        }
    }

    private void validateTargetAmount(Map<String, Object> data, List<String> errors) {
        Object targetObj = data.get("targetAmount");
        if (targetObj == null) {
            errors.add("Vui lòng nhập số tiền mục tiêu.");
            return;
        }
        try {
            BigDecimal target = new BigDecimal(targetObj.toString());
            if (target.compareTo(BigDecimal.ZERO) <= 0) {
                errors.add("Số tiền mục tiêu phải lớn hơn 0.");
            }
        } catch (NumberFormatException e) {
            errors.add("Số tiền mục tiêu không hợp lệ.");
        }
    }

    private void validateCategory(Map<String, Object> data, ProfileEntity profile, List<String> errors) {
        String categoryName = (String) data.get("categoryName");
        if (categoryName == null || categoryName.isBlank()) {
            errors.add("Vui lòng chọn danh mục.");
            return;
        }
        boolean exists = categoryRepository.existsByNameAndProfileId(categoryName, profile.getId());
        if (!exists) {
            errors.add("Danh mục '" + categoryName + "' không tồn tại. Bạn có muốn tạo mới không?");
        }
    }

    private void validateCategoryName(Map<String, Object> data, ProfileEntity profile, List<String> errors) {
        String name = (String) data.get("name");
        if (name == null || name.isBlank()) {
            errors.add("Vui lòng nhập tên danh mục.");
            return;
        }
        boolean exists = categoryRepository.existsByNameAndProfileId(name, profile.getId());
        if (exists) {
            errors.add("Danh mục '" + name + "' đã tồn tại.");
        }
    }

    private void validateName(Map<String, Object> data, List<String> errors) {
        String name = (String) data.get("name");
        if (name == null || name.isBlank()) {
            errors.add("Vui lòng nhập tên.");
        }
    }

    private void validateDate(Map<String, Object> data, List<String> errors, boolean allowFuture) {
        String dateStr = (String) data.get("date");
        if (dateStr == null || dateStr.isBlank()) return;
        try {
            LocalDate date = LocalDate.parse(dateStr);
            if (!allowFuture && date.isAfter(LocalDate.now())) {
                errors.add("Ngày không thể là ngày tương lai.");
            }
        } catch (Exception e) {
            errors.add("Định dạng ngày không hợp lệ. Dùng YYYY-MM-DD.");
        }
    }
}
