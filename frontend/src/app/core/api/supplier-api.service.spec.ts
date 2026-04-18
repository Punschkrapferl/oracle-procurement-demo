import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';

import { API_CONFIG } from '../config/api.config';
import { CreateSupplierRequest } from '../models/create-supplier-request.model';
import { SupplierResponse } from '../models/supplier-response.model';
import { SupplierApiService } from './supplier-api.service';

describe('SupplierApiService', () => {
  let service: SupplierApiService;
  let httpTestingController: HttpTestingController;

  const baseUrl = `${API_CONFIG.baseUrl}/suppliers`;

  const supplierResponse: SupplierResponse = {
    id: 1,
    supplierCode: 'SUP-1001',
    name: 'Acme Industrial Supplies',
    contactEmail: 'orders@acme-industrial.com',
    active: true
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        // Real HttpClient is needed by the service.
        provideHttpClient(),

        // Testing backend lets us intercept and assert HTTP requests.
        provideHttpClientTesting(),

        SupplierApiService
      ]
    });

    service = TestBed.inject(SupplierApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Ensures no unexpected HTTP request remains unverified.
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load all suppliers', () => {
    let actualResponse: SupplierResponse[] | undefined;

    service.getAllSuppliers().subscribe((response) => {
      actualResponse = response;
    });

    const request = httpTestingController.expectOne(baseUrl);

    expect(request.request.method).toBe('GET');

    request.flush([supplierResponse]);

    expect(actualResponse).toEqual([supplierResponse]);
  });

  it('should create a supplier', () => {
    const createRequest: CreateSupplierRequest = {
      supplierCode: 'SUP-1001',
      name: 'Acme Industrial Supplies',
      contactEmail: 'orders@acme-industrial.com',
      active: true
    };

    let actualResponse: SupplierResponse | undefined;

    service.createSupplier(createRequest).subscribe((response) => {
      actualResponse = response;
    });

    const request = httpTestingController.expectOne(baseUrl);

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(createRequest);

    request.flush(supplierResponse);

    expect(actualResponse).toEqual(supplierResponse);
  });
});
