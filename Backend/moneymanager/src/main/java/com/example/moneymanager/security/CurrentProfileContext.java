package com.example.moneymanager.security;

import com.example.moneymanager.entity.ProfileEntity;
import lombok.Getter;
import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.RequestScope;

@Component
@RequestScope
public class CurrentProfileContext {

    @Getter
    private ProfileEntity cachedProfile;

    public void setCachedProfile(ProfileEntity profile) {
        this.cachedProfile = profile;
    }

    public Long getProfileId() {
        return cachedProfile != null ? cachedProfile.getId() : null;
    }
}