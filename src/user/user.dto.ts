import { IsEmail, IsNotEmpty, IsStrongPassword } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsStrongPassword({ minLength: 6 })
  password: string;

  @IsNotEmpty()
  personalInfo: string;
}
