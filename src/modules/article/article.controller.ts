import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Put,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import {
  CreateArticleDto,
  GetArticleParams,
  TypeArticle,
} from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { API_SUCCESS } from '../../common/constant';
import { JwtAuthGuard, JwtStrategy } from '../auth/jwt.strategy';
import { IUserInfo, UserInfo } from '../../common/decorators/user.decorator';

@Controller('article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() createArticleDto: CreateArticleDto,
    @UserInfo() user: IUserInfo,
  ) {
    return this.articleService.create(createArticleDto, user);
  }

  @Get()
  async findAll(@Query() getParams: GetArticleParams) {
    const res = this.articleService.findAll(getParams);
    return {
      code: API_SUCCESS,
      data: res,
    };
  }

  @Get('type-article')
  async findOne() {
    const typeArticle = await this.articleService.findTypeArticle();
    return {
      code: API_SUCCESS,
      data: typeArticle,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('findByUser')
  async findArticleCreate(@UserInfo() user: IUserInfo) {
    const typeArticle = await this.articleService.findByUser(user);
    return {
      code: API_SUCCESS,
      data: typeArticle,
    };
  }

  @Post('type-article')
  async createTypeArticle(@Body() typeArticle: TypeArticle) {
    const resTyper = await this.articleService.creaetArticle(typeArticle);
    return {
      code: API_SUCCESS,
      data: resTyper,
    };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
  ) {
    return this.articleService.update(id, updateArticleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.articleService.remove(+id);
  }
}
