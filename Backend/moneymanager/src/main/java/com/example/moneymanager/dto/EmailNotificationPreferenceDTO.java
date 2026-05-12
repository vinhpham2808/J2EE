package com.example.moneymanager.dto;

import com.example.moneymanager.entity.EmailNotificationPreferenceEntity;
import com.example.moneymanager.entity.EmailNotificationType;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailNotificationPreferenceDTO {

    private Long id;
    private String type;
    private Boolean isEnabled;
    private String displayName;
    private String icon;
    private Boolean isCritical;
    private Boolean isOptional;

    public static EmailNotificationPreferenceDTO fromEntity(EmailNotificationPreferenceEntity entity) {
        EmailNotificationType type = entity.getType();
        return EmailNotificationPreferenceDTO.builder()
            .id(entity.getId())
            .type(type.name())
            .isEnabled(entity.getIsEnabled())
            .displayName(type.getDisplayName())
            .icon(type.getIcon())
            .isCritical(type.isCritical())
            .isOptional(type.isOptional())
            .build();
    }
}
