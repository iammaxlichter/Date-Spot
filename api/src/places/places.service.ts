import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreatePlaceDto,
  NearbyPlacesQueryDto,
  RatePlaceDto,
} from "./dto/place.dto";

@Injectable()
export class PlacesService {
  constructor(private prisma: PrismaService) {}

  private get client() {
    return this.prisma as any;
  }

  async createPlace(dto: CreatePlaceDto) {
    if (dto.googlePlaceId) {
      const existing = await this.client.place.findUnique({
        where: { googlePlaceId: dto.googlePlaceId },
      });
      if (existing) return existing;
    }

    return this.client.place.create({
      data: {
        name: dto.name,
        latitude: dto.latitude,
        longitude: dto.longitude,
        address: dto.address,
        googlePlaceId: dto.googlePlaceId,
      },
    });
  }

  async getPlaceById(id: string) {
    const place = await this.client.place.findUnique({
      where: { id },
      include: {
        ratings: true,
      },
    });

    if (!place) {
      throw new NotFoundException("Place not found");
    }

    const { ratings, ...rest } = place;

    const totalRatings = ratings.length;
    const atmosphereAverage =
      totalRatings === 0
        ? null
        : ratings.reduce((sum, r) => sum + r.atmosphereScore, 0) /
          totalRatings;
    const dateAverage =
      totalRatings === 0
        ? null
        : ratings.reduce((sum, r) => sum + r.dateScore, 0) / totalRatings;

    return {
      ...rest,
      totalRatings,
      atmosphereAverage,
      dateAverage,
      ratings,
    };
  }
async getNearbyPlaces(query: NearbyPlacesQueryDto | any) {
  const latitude =
    typeof query.latitude === "string"
      ? parseFloat(query.latitude)
      : query.latitude;

  const longitude =
    typeof query.longitude === "string"
      ? parseFloat(query.longitude)
      : query.longitude;

  const radiusKmRaw =
    query.radiusKm !== undefined && query.radiusKm !== null
      ? query.radiusKm
      : 10;

  const radiusKm =
    typeof radiusKmRaw === "string"
      ? parseFloat(radiusKmRaw)
      : radiusKmRaw;

  const delta = radiusKm / 111;

  const places = await this.client.place.findMany({
    where: {
      latitude: {
        gte: latitude - delta,
        lte: latitude + delta,
      },
      longitude: {
        gte: longitude - delta,
        lte: longitude + delta,
      },
    },
    include: {
      ratings: true,
    },
  });

  return places.map((p: any) => {
    const totalRatings = p.ratings.length;
    const atmosphereAverage =
      totalRatings === 0
        ? null
        : p.ratings.reduce(
            (sum: number, r: any) => sum + r.atmosphereScore,
            0,
          ) / totalRatings;
    const dateAverage =
      totalRatings === 0
        ? null
        : p.ratings.reduce(
            (sum: number, r: any) => sum + r.dateScore,
            0,
          ) / totalRatings;

    const { ratings, ...rest } = p;

    return {
      ...rest,
      totalRatings,
      atmosphereAverage,
      dateAverage,
    };
  });
}


  async ratePlace(placeId: string, userId: string, dto: RatePlaceDto) {
    // ensure place exists
    const place = await this.client.place.findUnique({
      where: { id: placeId },
    });

    if (!place) {
      throw new NotFoundException("Place not found");
    }

    const rating = await this.client.spotRating.upsert({
      where: {
        userId_placeId: {
          userId,
          placeId,
        },
      },
      update: {
        atmosphereScore: dto.atmosphereScore,
        dateScore: dto.dateScore,
        recommend: dto.recommend ?? true,
        notes: dto.notes,
      },
      create: {
        userId,
        placeId,
        atmosphereScore: dto.atmosphereScore,
        dateScore: dto.dateScore,
        recommend: dto.recommend ?? true,
        notes: dto.notes,
      },
    });

    return rating;
  }

  async getMySpots(userId: string) {
    const ratings = await this.client.spotRating.findMany({
      where: { userId },
      include: {
        place: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return ratings;
  }
}
