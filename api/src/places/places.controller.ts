import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { PlacesService } from "./places.service";
import {
  CreatePlaceDto,
  NearbyPlacesQueryDto,
  RatePlaceDto,
} from "./dto/place.dto";
// adjust this import/name to your existing guard
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("places")
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  // Anyone logged in can create a new place
  @UseGuards(JwtAuthGuard)
  @Post()
  createPlace(@Body() dto: CreatePlaceDto) {
    return this.placesService.createPlace(dto);
  }

  // public read for now (you can guard this if you want)
  @Get(":id")
  getPlace(@Param("id") id: string) {
    return this.placesService.getPlaceById(id);
  }

  // nearby query: /places?latitude=..&longitude=..&radiusKm=10
  @Get()
  getNearbyPlaces(@Query() query: NearbyPlacesQueryDto) {
    return this.placesService.getNearbyPlaces(query);
  }

  // rate a place as the current user
  @UseGuards(JwtAuthGuard)
  @Post(":id/ratings")
  ratePlace(
    @Param("id") placeId: string,
    @Body() dto: RatePlaceDto,
    @Req() req: any,
  ) {
    // adjust this based on your JWT payload: sub vs id vs userId
    const userId = req.user.sub ?? req.user.id ?? req.user.userId;
    return this.placesService.ratePlace(placeId, userId, dto);
  }

  // get all spots rated by the current user
  @UseGuards(JwtAuthGuard)
  @Get("me/spots")
  getMySpots(@Req() req: any) {
    const userId = req.user.sub ?? req.user.id ?? req.user.userId;
    return this.placesService.getMySpots(userId);
  }
}
