import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
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
  @IsInt()
  @Min(1)
  @Max(50)
  radiusKm?: number = 10;
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

  @Type(() => Boolean)
  @IsBoolean()
  wouldReturn: boolean;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsIn(["Chill", "Romantic", "Energetic", "Intimate", "Social"])
  vibe?: "Chill" | "Romantic" | "Energetic" | "Intimate" | "Social";

  @IsOptional()
  @IsIn(["$", "$$", "$$$", "$$$$", "$$$$$"])
  price?: "$" | "$$" | "$$$" | "$$$$" | "$$$$$";

  @IsOptional()
  @IsIn(["Day", "Night", "Sunset", "Any"])
  bestFor?: "Day" | "Night" | "Sunset" | "Any";
}
