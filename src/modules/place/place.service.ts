import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { addMinutes, subMinutes } from 'date-fns';
import { Like, Repository } from 'typeorm';
import { API_FAIL, PLACE_MESSAGE, ROLE } from '../../common/constant';
import { IUserInfo } from '../../common/decorators/user.decorator';
import { OwnerPlace } from '../owner-place/entities/owner-place.entity';
import { CreatePlaceDto } from './dto/create-place.dto';
import { GetPlaceOwner, GetPlaceParams } from './dto/get-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { Place } from './entities/place.entity';
import { ServicePlace } from './entities/service-place.entity';
import { TimeGold } from './entities/time-gold.entity';
import { TypePlace } from './entities/type-place.entity';
import { DateOff } from './entities/place-date-off.entity';
import { HistoryBlockBooking } from '../order/entities/history-block-booking.entity';
@Injectable()
export class PlaceService {
  constructor(
    @InjectRepository(Place)
    private placeRepository: Repository<Place>,
    @InjectRepository(TypePlace)
    private typePlaceRepository: Repository<TypePlace>,
    @InjectRepository(OwnerPlace)
    private ownerPlaceRepository: Repository<OwnerPlace>,
    @InjectRepository(ServicePlace)
    private servicePlaceRepository: Repository<ServicePlace>,
    @InjectRepository(TimeGold)
    private timeGoldPlaceRepository: Repository<TimeGold>,
    @InjectRepository(DateOff)
    private dayOffRepository: Repository<DateOff>,
    @InjectRepository(HistoryBlockBooking)
    private historyBlockBookingRepository: Repository<HistoryBlockBooking>,

    private readonly jwtService: JwtService,
  ) {}
  async create(createPlaceDto: CreatePlaceDto, user) {
    const owner = await this.ownerPlaceRepository.findOne({
      where: { id: user.relativeId },
    });

    const place = await this.placeRepository.create({
      owner,
      ...createPlaceDto,
    });
    await this.placeRepository.save(place);
    return place;
  }
  async createOrder() {
    // Ki???m tra ti???n trong tk
    // Ki???m tra gi??? ?????t c?? tr???ng
    // G???i mail cho admin
    return 1;
  }

  async confirmOrder(token, orderId) {
    const payload = await this.jwtService.verify(token);
    if (payload.role !== ROLE.owner) {
      return API_FAIL;
    }
  }

  async findAll(getParams: GetPlaceParams) {
    const queryTypePlace = getParams.typePlace
      ? {
          isEnable: true,
          name: getParams.name ? Like(`%${getParams.name}%`) : Like(`%%`),
          address: getParams.address
            ? Like(`%${getParams.address}%`)
            : Like(`%%`),
          typePlace: { id: getParams.typePlace },
        }
      : {
          isEnable: true,
          name: getParams.name ? Like(`%${getParams.name}%`) : Like(`%%`),
          address: getParams.address
            ? Like(`%${getParams.address}%`)
            : Like(`%%`),
        };
    console.log(queryTypePlace);
    const places = await this.placeRepository.findAndCount({
      where: { ...queryTypePlace },
      skip: (getParams.page - 1) * getParams.pageSize,
      take: getParams.pageSize,
      relations: ['typePlace', 'timeGold', 'services'],
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
      relations: [
        'services',
        'timeGold',
        'owner',
        'comments',
        'voucherCreate',
        'typePlace',
      ],
    });
    return place;
  }
  async createDayOff(dayOffDto, user) {
    const isOwner = await this.placeRepository.findOne({
      where: {
        id: dayOffDto.place.id,
        owner: {
          id: user.relativeId,
        },
      },
    });
    if (!isOwner) {
      return { message: 'Kh??ng ph???i ch??? s??n' };
    }
    const dayOff = await this.dayOffRepository.create(dayOffDto);
    await this.dayOffRepository.save(dayOff);
    return dayOff;
  }

  async disableTimeBlock(disableTimeBlock, user) {
    const isOwner = await this.placeRepository.findOne({
      where: {
        id: disableTimeBlock.place.id,
        owner: {
          id: user.relativeId,
        },
      },
    });
    if (!isOwner) {
      return { message: 'Kh??ng ph???i ch??? s??n' };
    }
    const historyBlock = await this.historyBlockBookingRepository.create(
      disableTimeBlock,
    );
    await this.historyBlockBookingRepository.save(historyBlock);
    return historyBlock;
  }

  async getTimeAvailable(placeId, day) {
    const place = await this.placeRepository.findOne({
      where: { id: placeId },
      relations: ['timeGold'],
    });
    const isDayOff = await this.dayOffRepository.findOneBy({
      dayOff: day.day,
      place: { id: place.id },
    });
    if (isDayOff) return { messgae: isDayOff.reason };
    const disableBlock = await this.historyBlockBookingRepository.findBy({
      dayOrder: day.day,
      place: { id: placeId },
    });
    return this.getTimeFromBlock(
      place.timeOpen,
      place.timeClose,
      place.timeGold,
      place.timeDistance,
      place.priceMin,
      disableBlock,
    );
  }
  getTimeFromBlock(
    timeOpen,
    timeClose,
    TimeGolds,
    timeDistance,
    price,
    disableBlocks,
  ) {
    const timeStart = new Date(
      2020,
      1,
      1,
      Number(timeOpen.slice(0, 2)),
      Number(timeOpen.slice(-2)),
    );
    const times = [];
    if (
      TimeGolds.find(
        (timeGold) => timeGold.timeStart == timeStart.toString().slice(16, 21),
      )
    ) {
      const isTimeGood = TimeGolds.find(
        (timeGold) => timeGold.timeStart == timeStart.toString().slice(16, 21),
      );
      const isDisbleBlock = disableBlocks.find(
        (disableBlock) =>
          disableBlock.timeStart === timeStart.toString().slice(16, 21),
      );
      times.push({
        time: timeStart.toString().slice(16, 21),
        price: isTimeGood.price,
        isReady: isDisbleBlock ? false : true,
      });
    } else {
      const isDisbleBlock = disableBlocks.find(
        (disableBlock) =>
          disableBlock.timeStart === timeStart.toString().slice(16, 21),
      );
      times.push({
        time: timeStart.toString().slice(16, 21),
        price,
        isReady: isDisbleBlock ? false : true,
      });
    }
    const timeEnd = new Date(
      2020,
      1,
      1,
      timeClose.slice(0, 2),
      timeClose.slice(-2),
    );
    let timeConut = timeStart;

    while (timeConut < timeEnd) {
      timeConut = addMinutes(timeConut, timeDistance);
      const timeAdd = timeConut.toString().slice(16, 21);
      const isTimeGood = TimeGolds.find(
        (timeGold) => timeGold.timeStart == timeAdd,
      );
      const isDisbleBlock = disableBlocks.find(
        (disableBlock) => disableBlock.timeStart === timeAdd,
      );
      if (isTimeGood) {
        times.push({
          time: timeAdd,
          price: isTimeGood.price,
          isReady: isDisbleBlock ? false : true,
        });
      } else {
        times.push({
          time: timeAdd,
          price,
          isReady: isDisbleBlock ? false : true,
        });
      }
    }

    return times;
  }

  async update(id: string, updatePlaceDto: UpdatePlaceDto) {
    const update = await this.placeRepository.update(id, updatePlaceDto);
    return { message: 'C???p nh???t th??nh c??ng' };
  }

  async remove(id: string, user) {
    const place = await this.placeRepository.findOne({
      where: { id: id },
      relations: ['owner'],
    });
    if (place.owner.id === user.relativeId) {
      await this.placeRepository.update(id, {
        isEnable: false,
        isDeleted: true,
      });
    }
    return PLACE_MESSAGE.DISABLE_SUCCESS;
  }

  async createTypePlace(data) {
    const typePlace = await this.typePlaceRepository.create(data);
    await this.typePlaceRepository.save(typePlace);
    return typePlace;
  }

  async getTypePlaceAdmin() {
    const typePlace = await this.typePlaceRepository.find({
      where: {
        isDeleted: false,
      },
    });
    return typePlace;
  }

  async getPlaceOwner(getParams: GetPlaceOwner, user: IUserInfo) {
    const places = await this.placeRepository.findAndCount({
      relations: ['owner'],
      where: {
        isDeleted: false,
        name: getParams.name ? Like(`%${getParams.name}%`) : Like(`%%`),
        owner: {
          id: user.relativeId,
        },
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

  async getTypePlace() {
    const typePlace = await this.typePlaceRepository.find({
      where: {
        isDeleted: false,
        isActive: true,
      },
      relations: ['place'],
    });

    return typePlace;
  }

  async createService(createSerivceDto, user: IUserInfo) {
    const isOwner = await this.placeRepository.findOne({
      where: {
        id: createSerivceDto.place.id,
        owner: {
          id: user.relativeId,
        },
      },
    });
    if (isOwner) {
      const service = await this.servicePlaceRepository.create(
        createSerivceDto,
      );
      await this.servicePlaceRepository.save(service);
      return service;
    } else {
      return { message: 'Kh??ng ph???i ch??? s??n ' };
    }
  }
  async updateTimeGold(id, updateTimeGold, user: IUserInfo) {
    const timeGold = await this.timeGoldPlaceRepository.findOne({
      where: { id },
      relations: ['place'],
    });
    if (timeGold) {
      const place = await this.placeRepository.findOne({
        where: { id: timeGold.place.id },
        relations: ['owner'],
      });
      if (place.owner.id !== user.relativeId) {
        return { message: 'Kh??ng t??m th???y time Gold' };
      }
      await this.timeGoldPlaceRepository.update(id, updateTimeGold);

      return { message: 'C???p nh???t time gold th??nh c??ng' };
    }
    return { message: 'Kh??ng t??m th???y time Gold' };
  }

  async updateService(id, updateTimeGold, user: IUserInfo) {
    const service = await this.servicePlaceRepository.findOne({
      where: { id },
      relations: ['place'],
    });
    if (service) {
      const place = await this.placeRepository.findOne({
        where: { id: service.place.id },
        relations: ['owner'],
      });
      if (place.owner.id !== user.relativeId) {
        return { message: 'Kh??ng t??m th???y d???ch vu' };
      }
      await this.servicePlaceRepository.update(id, updateTimeGold);
      return { message: 'C???p nh???t d???ch v??? th??nh c??ng' };
    }
    return { message: 'Kh??ng t??m th???y d???ch vu' };
  }
  async createTimeGold(timeGoldDto, user) {
    const timeGold = await this.timeGoldPlaceRepository.create(timeGoldDto);
    await this.timeGoldPlaceRepository.save(timeGold);
    return timeGold;
  }
}
