import { Test, TestingModule } from '@nestjs/testing';
import { KpiService } from './kpi.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { GamificationService } from '../gamification/gamification.service';

describe('KpiService (Manager Scoping Regression)', () => {
  let service: KpiService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KpiService,
        PrismaService,
        { provide: NotificationsService, useValue: { sendNotification: jest.fn() } },
        { provide: GamificationService, useValue: { awardPoints: jest.fn(), updateMissionProgress: jest.fn() } },
      ],
    }).compile();

    service = module.get<KpiService>(KpiService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should allow a manager to create a target for an employee in the same department', async () => {
    // Setup: Manager and Employee in same department
    const dept = await prisma.department.create({ data: { name: 'TestDept' } });
    
    const managerUser = await prisma.user.create({
      data: { email: 'mgr@test.com', name: 'Manager', role: UserRole.CS_MANAGER, password_hash: 'hash' }
    });
    const managerEmp = await prisma.employee.create({
      data: { 
        code: 'MGR001', 
        full_name: 'Manager', 
        email: 'mgr@test.com', 
        user: { connect: { id: managerUser.id } },
        department: { connect: { id: dept.id } },
        start_date: new Date(), 
        base_salary: '1000',
        salary_type: 'MONTHLY'
      }
    });

    const subUser = await prisma.user.create({
      data: { email: 'sub@test.com', name: 'Subordinate', role: UserRole.CS_AGENT, password_hash: 'hash' }
    });
    const subEmp = await prisma.employee.create({
      data: { 
        code: 'SUB001', 
        full_name: 'Subordinate', 
        email: 'sub@test.com', 
        user: { connect: { id: subUser.id } },
        department: { connect: { id: dept.id } },
        start_date: new Date(), 
        base_salary: '500',
        salary_type: 'MONTHLY'
      }
    });

    // Test: Create Target
    const target = await service.createTarget(
      { employeeId: subEmp.id, metric: 'QUALITY', targetValue: 90, weight: 50, date: new Date().toISOString() },
      managerUser.id,
      managerUser
    );

    expect(target).toBeDefined();
    expect(target.employee_id).toBe(subEmp.id);
    expect(target.department_id).toBe(dept.id);

    // Test: Visibility in getTeamTargets
    const teamTargets = await service.getTeamTargets(managerUser);
    const found = teamTargets.find(t => t.id === target.id);
    expect(found).toBeDefined();
    expect(found.employee.full_name).toBe('Subordinate');

    // Cleanup
    await prisma.kPITarget.delete({ where: { id: target.id } });
    await prisma.employee.deleteMany({ where: { department_id: dept.id } });
    await prisma.user.deleteMany({ where: { email: { in: ['mgr@test.com', 'sub@test.com'] } } });
    await prisma.department.delete({ where: { id: dept.id } });
  });

  it('should prevent a manager from creating a target for an employee in a DIFFERENT department', async () => {
    const dept1 = await prisma.department.create({ data: { name: 'Dept1' } });
    const dept2 = await prisma.department.create({ data: { name: 'Dept2' } });

    const mgrUser = await prisma.user.create({
      data: { email: 'mgr2@test.com', name: 'Mgr2', role: UserRole.CS_MANAGER, password_hash: 'hash' }
    });
    await prisma.employee.create({
      data: { 
        code: 'MGR002', 
        full_name: 'Mgr2', 
        email: 'mgr2@test.com', 
        user: { connect: { id: mgrUser.id } },
        department: { connect: { id: dept1.id } },
        start_date: new Date(), 
        base_salary: '1000',
        salary_type: 'MONTHLY'
      }
    });

    const otherUser = await prisma.user.create({
      data: { email: 'other@test.com', name: 'Other', role: UserRole.ACC_AGENT, password_hash: 'hash' }
    });
    const otherEmp = await prisma.employee.create({
      data: { 
        code: 'OTH001', 
        full_name: 'Other', 
        email: 'other@test.com', 
        user: { connect: { id: otherUser.id } },
        department: { connect: { id: dept2.id } },
        start_date: new Date(), 
        base_salary: '500',
        salary_type: 'MONTHLY'
      }
    });

    await expect(service.createTarget(
      { employeeId: otherEmp.id, metric: 'QUALITY', targetValue: 90 },
      mgrUser.id,
      mgrUser
    )).rejects.toThrow(ForbiddenException);

    // Cleanup
    await prisma.employee.deleteMany({ where: { department_id: { in: [dept1.id, dept2.id] } } });
    await prisma.user.deleteMany({ where: { email: { in: ['mgr2@test.com', 'other@test.com'] } } });
    await prisma.department.deleteMany({ where: { id: { in: [dept1.id, dept2.id] } } });
  });
});
