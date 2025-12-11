import { IsNumber, IsOptional, IsString, Max, Min } from "class-validator";
import { Type } from "class-transformer";

export class CreatePlaceDto {
  @IsString()
  name: string;

  @Type(() => Number)
  @IsNumber()
  latitude: number;

  @Type(() => Number)
  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  googlePlaceId?: string;
}

export class RatePlaceDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(10)
  atmosphereScore: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(10)
  dateScore: number;

  @IsOptional()
  recommend?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class NearbyPlacesQueryDto {
  @Type(() => Number)
  @IsNumber()
  latitude: number;

  @Type(() => Number)
  @IsNumber()
  longitude: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  radiusKm?: number; // default set in service
}
