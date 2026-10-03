import { Injectable } from '@nestjs/common';
import type { SearchResult, SearchResponse } from '@prince-net/types';
import { PrismaService } from '../prisma/prisma.service';
import { toMoneyStringRequired } from '../common/utils/money.util';

const MAX_RESULTS = 20;

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: string): Promise<SearchResponse> {
    const q = query.trim();

    if (q.length < 2) {
      return { results: [] };
    }

    const [distributors, packages, sales, lines, expenses] =
      await Promise.all([
        this.prisma.distributor.findMany({
          where: {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q, mode: 'insensitive' } },
            ],
          },
          take: MAX_RESULTS,
          select: {
            id: true,
            name: true,
            phone: true,
          },
        }),

        this.prisma.package.findMany({
          where: {
            name: {
              contains: q,
              mode: 'insensitive',
            },
          },
          take: MAX_RESULTS,
          select: {
            id: true,
            name: true,
            price: true,
          },
        }),

        this.prisma.sale.findMany({
          where: {
            invoiceNumber: {
              contains: q,
              mode: 'insensitive',
            },
          },
          take: MAX_RESULTS,
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            distributor: {
              select: {
                name: true,
              },
            },
          },
        }),

        this.prisma.line.findMany({
          where: {
            OR: [
              {
                name: {
                  contains: q,
                  mode: 'insensitive',
                },
              },
              {
                identifier: {
                  contains: q,
                  mode: 'insensitive',
                },
              },
              {
                provider: {
                  contains: q,
                  mode: 'insensitive',
                },
              },
            ],
          },
          take: MAX_RESULTS,
          select: {
            id: true,
            name: true,
            provider: true,
            identifier: true,
          },
        }),

        this.prisma.expense.findMany({
          where: {
            description: {
              contains: q,
              mode: 'insensitive',
            },
          },
          take: MAX_RESULTS,
          select: {
            id: true,
            description: true,
            amount: true,
            status: true,
          },
        }),
      ]);

    const results: SearchResult[] = [
      ...distributors.map((d) => ({
        type: 'DISTRIBUTOR' as const,
        id: d.id,
        title: d.name,
        subtitle: d.phone,
        amount: null,
        url: `/distributors/${d.id}`,
      })),

      ...packages.map((p) => ({
        type: 'PACKAGE' as const,
        id: p.id,
        title: p.name,
        subtitle: p.price.toString(),
        amount: toMoneyStringRequired(p.price),
        url: `/packages/${p.id}`,
      })),

      ...sales.map((s) => ({
        type: 'SALE' as const,
        id: s.id,
        title: s.invoiceNumber,
        subtitle: s.distributor.name,
        amount: toMoneyStringRequired(s.totalAmount),
        url: `/sales/${s.id}`,
      })),

      ...lines.map((l) => ({
        type: 'LINE' as const,
        id: l.id,
        title: l.name,
        subtitle: `${l.provider} — ${l.identifier}`,
        amount: null,
        url: `/lines/${l.id}`,
      })),

      ...expenses.map((e) => ({
        type: 'EXPENSE' as const,
        id: e.id,
        title: e.description,
        subtitle: e.status,
        amount: toMoneyStringRequired(e.amount),
        url: `/expenses/${e.id}`,
      })),
    ];

    return {
      results: results.slice(0, MAX_RESULTS),
    };
  }
}