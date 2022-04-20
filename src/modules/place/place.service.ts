import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PLACE_MESSAGE } from '../../common/constant';
import { OwnerPlace } from '../owner-place/entities/owner-place.entity';
import { CreatePlaceDto } from './dto/create-place.dto';
import { GetPlaceParams } from './dto/get-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { Place } from './entities/place.entity';

@Injectable()
export class PlaceService {
  constructor(
    @InjectRepository(Place)
    private placeRepository: Repository<Place>,
    @InjectRepository(OwnerPlace)
    private ownerPlaceRepository: Repository<OwnerPlace>,
  ) {}
  async create(createPlaceDto: CreatePlaceDto, user) {
    console.log(user);
    const owner = await this.ownerPlaceRepository.findOne({
      where: { id: user.relativeId },
    });
    console.log(owner);

    const place = await this.placeRepository.create({
      owner: owner,
      // timeOpen: createPlaceDto.timeOpen,
      // timeClose: createPlaceDto.timeClose,
      // timeDistance: createPlaceDto.timeDistance,
      // priceMin: createPlaceDto.priceMin,
      // address: createPlaceDto.address,
      // imageBanner: createPlaceDto.imageBanner,
      // imageDetails: createPlaceDto.imageDetails,
      ...createPlaceDto,
    });
    await this.placeRepository.save(place);
    return place;
  }

  async findAll(getParams: GetPlaceParams) {
    const places = await this.placeRepository.findAndCount({
      where: {
        isEnable: true,
      },
      skip: (getParams.page - 1) * getParams.pageSize,
      take: getParams.pageSize,
    });
    return {
      total: places[1],
      pageSize: getParams.pageSize,
      currentPage: getParams.page,
      records: places[0],
    };
  }

  async findOne(id: string) {
    const place = await this.placeRepository.findOne({
      where: {
        isEnable: true,
        id,
      },
    });
    return place;
  }

  update(id: number, updatePlaceDto: UpdatePlaceDto) {
    return `This action updates a #${id} place`;
  }

  async remove(id: string) {
    await this.placeRepository.update(id, {
      isEnable: false,
    });
    return PLACE_MESSAGE.DISABLE_SUCCESS;
  }
}
