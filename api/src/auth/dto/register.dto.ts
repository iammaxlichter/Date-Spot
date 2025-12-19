// api/src/auth/dto/register.dto.ts
import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
