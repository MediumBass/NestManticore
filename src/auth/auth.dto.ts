import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateSessionDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}
