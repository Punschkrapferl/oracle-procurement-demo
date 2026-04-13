package com.example.oracleprocurementdemo.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "Oracle Procurement Demo API",
                version = "v1",
                description = "Recruiter-friendly Spring Boot backend demo for Oracle-backed supplier and purchase order workflows."
        ),
        servers = @Server(
                url = "http://localhost:8080",
                description = "Local development server"
        )
)
public class OpenApiConfig {
}