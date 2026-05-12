package com.example.moneymanager.service;

import com.example.moneymanager.entity.ProfileEntity;
import com.example.moneymanager.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AppUserDetailsService implements UserDetailsService {

    private final ProfileRepository profileRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        ProfileEntity existingProfile = profileRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Profile not found with email: " + email));

        String roleName = (existingProfile.getRole() != null && existingProfile.getRole().getName() != null)
                ? existingProfile.getRole().getName().toUpperCase()
                : "USER";

        return User.builder()
                .username(existingProfile.getEmail())
                .password(existingProfile.getPassword() != null ? existingProfile.getPassword() : "")
                .disabled(!Boolean.TRUE.equals(existingProfile.getIsActive()))
                .roles(roleName)
                .build();
    }
}
