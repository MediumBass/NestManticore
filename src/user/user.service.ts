import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as sc from '../database/schema';
import { DrizzleAsyncProvider } from '../database/drizzle.provider';
import { eq } from 'drizzle-orm';
import { CreateUserDto } from './user.dto';
import { hash } from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof sc>,
  ) {}

  async register(dto: CreateUserDto) {
    const user = await this.db.query.users.findFirst({
      where: eq(sc.users.email, dto.email),
    });
    if (user) throw new ConflictException('User already exists');

    return this.db
      .insert(sc.users)
      .values({
        ...dto,
        password: await hash(dto.password, Number(process.env.SALT_ROUNDS)),
      })
      .returning({ id: sc.users.id, email: sc.users.email });
  }

  async getFullUserData(email: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(sc.users.email, email),
    });
    const { password, ...userWithoutPassword } = user || {};
    return userWithoutPassword;
  }
}
