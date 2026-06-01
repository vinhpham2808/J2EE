package com.example.moneymanager.security;

import com.example.moneymanager.entity.ProfileEntity;
import com.example.moneymanager.repository.ProfileRepository;
import com.example.moneymanager.util.JwtUtil;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtRequestFilter extends OncePerRequestFilter {

    private final UserDetailsService userDetailsService;
    private final JwtUtil jwtUtil;
    private final CurrentProfileContext currentProfileContext;
    private final ProfileRepository profileRepository;

    @Value("${jwt.cookie.name:mm_token}")
    private String cookieName;


    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String email = null;
        String jwt = null;

        final String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            jwt = authHeader.substring(7);
        }

        if (jwt == null && request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (cookieName.equals(cookie.getName())) {
                    jwt = cookie.getValue();
                    break;
                }
            }
        }

        if (jwt != null) {
            try {
                email = jwtUtil.extractUsername(jwt);
            } catch (JwtException | IllegalArgumentException e) {
                // Token is invalid or expired. Do not block the request here so that public
                // endpoints (e.g. /login, /auth/google, /register) can still be accessed.
                // Spring Security will enforce authorization for secured endpoints.
            }
        }

        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(email);
                if (jwtUtil.validateToken(jwt, userDetails) && userDetails.isEnabled()) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities()
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);

                    // Cache full ProfileEntity vào request-scope context để ProfileService
                    // không cần query DB thêm lần nữa trong cùng request này.
                    if (userDetails instanceof AppUserPrincipal principal) {
                        profileRepository.findByEmail(principal.getUsername())
                                .ifPresent(currentProfileContext::setCachedProfile);
                    }
                }
            } catch (Exception e) {
                // Ignore exception (e.g. UsernameNotFoundException) to let public endpoints still be accessible.
                // Security will be enforced by Spring Security for protected paths.
            }
        }
        filterChain.doFilter(request, response);
    }
}
