import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import * as sc from '../database/schema';
import { DrizzleAsyncProvider } from '../database/drizzle.provider';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreateSessionDto } from './auth.dto';
import { compare } from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof sc>,
    private jwtService: JwtService,
  ) {}

  async signIn(dto: CreateSessionDto): Promise<{ access_token: string }> {
    const user = await this.db.query.users.findFirst({
      where: eq(sc.users.email, dto.email),
    });
    if (!(await compare(dto.password, user?.password))) {
      throw new BadRequestException({ message: 'Invalid password or email' });
    }
    const payload = { sub: user?.id, email: user?.email };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
