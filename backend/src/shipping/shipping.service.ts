import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShippingCompanyDto } from './dto/create-shipping-company.dto';

@Injectable()
export class ShippingService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateShippingCompanyDto) {
    return this.prisma.shippingCompany.create({
      data: {
        name: dto.name,
      },
    });
  }

  async findAll() {
    return this.prisma.shippingCompany.findMany({
      where: { is_active: true },
    });
  }
}
