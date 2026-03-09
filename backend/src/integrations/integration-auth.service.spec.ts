import { Test, TestingModule } from '@nestjs/testing';
import { IntegrationAuthService } from './integration-auth.service';

describe('IntegrationAuthService', () => {
  let service: IntegrationAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IntegrationAuthService],
    }).compile();

    service = module.get<IntegrationAuthService>(IntegrationAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
