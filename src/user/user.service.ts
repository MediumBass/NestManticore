import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as sc from '../database/schema';
import { DrizzleAsyncProvider } from '../database/drizzle.provider';
import { eq } from 'drizzle-orm';
import { CreateUserDto } from './user.dto';
import { hash, compare } from 'bcrypt';
import { CreateSessionDto } from '../auth/auth.dto';
import { User, UserNoPassword } from '../types';

@Injectable()
export class UserService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof sc>,
  ) {}

  async register(dto: CreateUserDto): Promise<{ id: number; email: string }[]> {
    const user: User | undefined = await this.db.query.users.findFirst({
      where: eq(sc.users.email, dto.email),
    });
    if (user) throw new ConflictException('User already exists');
    if (isNaN(Number(process.env.SALT_ROUNDS))) {
      throw new InternalServerErrorException(
        'Invalid SALT_ROUNDS environment variable',
      );
    }
    return this.db
      .insert(sc.users)
      .values({
        ...dto,
        password: await hash(dto.password, Number(process.env.SALT_ROUNDS)),
      })
      .returning({ id: sc.users.id, email: sc.users.email });
  }

  async getFullUserData(email: string): Promise<UserNoPassword> {
    const user: User | undefined = await this.db.query.users.findFirst({
      where: eq(sc.users.email, email),
    });
    if (!user)
      throw new ConflictException('User with this email does not exist');
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async validateUser(dto: CreateSessionDto): Promise<CreateUserDto | null> {
    const user: User | undefined = await this.db.query.users.findFirst({
      where: eq(sc.users.email, dto.email),
    });
    if (!user) return null;

    const isPasswordValid: boolean = await compare(dto.password, user.password);
    return isPasswordValid ? user : null;
  }
}
