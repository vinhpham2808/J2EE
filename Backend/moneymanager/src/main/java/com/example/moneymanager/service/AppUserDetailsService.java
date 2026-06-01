package com.example.moneymanager.service;

import com.example.moneymanager.entity.ProfileEntity;
import com.example.moneymanager.repository.ProfileRepository;
import com.example.moneymanager.security.AppUserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Collections;

@Service
@RequiredArgsConstructor
public class AppUserDetailsService implements UserDetailsService {

    private final ProfileRepository profileRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        ProfileEntity profile = profileRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        String roleName = (profile.getRole() != null && profile.getRole().getName() != null)
                ? profile.getRole().getName().toUpperCase()
                : "USER";
        GrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + roleName);
        Collection<GrantedAuthority> authorities = Collections.singletonList(authority);

        return new AppUserPrincipal(
                profile.getId(),
                profile.getEmail(),
                profile.getPassword(),
                profile.getFullName(),
                profile.getIsActive(),
                roleName,
                profile.getSubscriptionPlan() != null ? profile.getSubscriptionPlan().name() : null,
                profile.getSubscriptionStatus() != null ? profile.getSubscriptionStatus().name() : null,
                authorities
        );
    }
}