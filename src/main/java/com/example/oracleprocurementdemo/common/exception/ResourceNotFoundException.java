package com.example.oracleprocurementdemo.common.exception;

public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String resourceName, Object id) {
        super(resourceName + " with id " + id + " not found");
    }
}