package com.example.moneymanager.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.lambda.LambdaClient;
import software.amazon.awssdk.services.s3.S3Client;

@Configuration
public class AwsConfig {

    @Value("${aws.access-key}")
    private String accessKey;

    @Value("${aws.secret-key}")
    private String secretKey;

    @Value("${aws.region}")
    private String region;

    private StaticCredentialsProvider credentialsProvider() {
        AwsBasicCredentials credentials = AwsBasicCredentials.create(accessKey, secretKey);
        return StaticCredentialsProvider.create(credentials);
    }

    @Bean
    public S3Client s3Client() {
        return S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(credentialsProvider())
                .build();
    }

    @Bean
    public LambdaClient lambdaClient() {
        return LambdaClient.builder()
                .region(Region.of(region))
                .credentialsProvider(credentialsProvider())
                .build();
    }
}
