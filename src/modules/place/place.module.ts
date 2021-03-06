import { Module } from '@nestjs/common';
import { PlaceService } from './place.service';
import { PlaceController } from './place.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OwnerPlace } from '../owner-place/entities/owner-place.entity';
import { Place } from './entities/place.entity';
import { TypePlace } from './entities/type-place.entity';
import { AdminPlaceController } from './admin.place.controller';
import { OwnerPlaceController } from './owner.place.controller';
import { ServicePlace } from './entities/service-place.entity';
import { TimeGold } from './entities/time-gold.entity';
import { DateOff } from './entities/place-date-off.entity';
import { HistoryBlockBooking } from '../order/entities/history-block-booking.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Place,
      OwnerPlace,
      TypePlace,
      ServicePlace,
      TimeGold,
      DateOff,
      HistoryBlockBooking,
    ]),
  ],
  controllers: [PlaceController, AdminPlaceController, OwnerPlaceController],
  providers: [PlaceService],
})
export class PlaceModule {}
