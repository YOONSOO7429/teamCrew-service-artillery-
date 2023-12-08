import {
  Controller,
  Get,
  Res,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HomeService } from './home.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger/dist';
import { ScheduleService } from 'src/schedule/schedule.service';

@Controller('home')
@ApiTags('Home API')
export class HomeController {
  constructor(
    private readonly homeService: HomeService,
    private readonly scheduleService: ScheduleService,
  ) {}

  /* 다가오는 일정 */
  @Get('comingDate')
  @ApiOperation({
    summary: '다가오는 일정 리스트 조회 API',
    description: '다가오는 일정 리스트 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '다가오는 일정 리스트 조회합니다.',
    schema: {
      example: {
        schedule: [
          {
            schedule: {
              scheduleTitle: '일요일 달리기!!',
              scheduleDDay: '2023-10-10T00:00:00.000Z',
              scheduleId: '8',
              crewType: '장기',
              crewId: '22',
            },
            profileImage: [
              {
                user_profileImage: null,
                participant_userId: null,
                participant_userName: null,
              },
            ],
          },
        ],
        nickname: '돌핀맨',
      },
    },
  })
  @ApiBearerAuth('accessToken')
  async findSchedule(@Res() res: any): Promise<any> {
    try {
      /* user 정보 확인 */
      // guest일 경우 userId를 0으로 처리
      const user = res.locals.user ? res.locals.user : null;
      const userId = user !== null ? user.userId : 0;
      const nickname = user.nickname;

      // 다가오는 일정 list 조회 오늘 날짜에 가까운 일정만 반환
      const data = await this.homeService.findSchedule(userId);
      const schedule = data[0];

      // 다가오는 일정 리스트 조회 결과가 있을 경우
      return res.status(HttpStatus.OK).json({ schedule, nickname });
    } catch (error) {
      console.error(error); // 로깅
      throw new HttpException(
        `리스트 조회 실패: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /* 다가오는 일정 전체, 승인 완료된 모임 일정 조회 */
  @Get('wholeComingDate')
  @ApiOperation({
    summary: '다가오는 일정 리스트 전체 조회 API',
    description: '다가오는 일정 리스트 전체를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '다가오는 일정 리스트 전체를 조회합니다.',
    schema: {
      example: {
        schedule: {
          scheduleTitle: '퇴근 후 40분 걷기',
          scheduleDDay: '2023-08-19T03:44:19.661Z',
        },
        participatedUser: { profileImage: 'URI' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '다가오는 일정 리스트 조회합니다.',
    schema: {
      example: {
        comingSchedule: [
          {
            schedule: {
              scheduleTitle: '일요일 달리기!!',
              scheduleDDay: '2023-10-10T00:00:00.000Z',
              scheduleId: '8',
              crewType: '장기',
              crewId: '22',
            },
            profileImage: [
              {
                user_profileImage: null,
                participant_userId: null,
                participant_userName: null,
              },
            ],
          },
        ],
        participateSchedule: [
          {
            schedule: {
              scheduleTitle: '일요일 달리기!!',
              scheduleDDay: '2023-08-19T00:00:00.000Z',
              scheduleId: '2',
              crewType: '단기',
              crewId: '10',
            },
            profileImage: [
              {
                user_profileImage: null,
                participant_userId: null,
                participant_userName: null,
              },
            ],
          },
        ],
      },
    },
  })
  @ApiBearerAuth('accessToken')
  async findWholeSchedule(@Res() res: any): Promise<any> {
    try {
      /* user 정보 확인 */
      // guest일 경우 userId를 0으로 처리
      const user = res.locals.user ? res.locals.user : null;
      const userId = user !== null ? user.userId : 0;
      // 다가오는 일정, 참여완료 일정 조회
      const comingSchedule = await this.homeService.findSchedule(userId);
      const participateSchedule =
        await this.homeService.findParticipateSchedule(userId);

      return res
        .status(HttpStatus.OK)
        .json({ comingSchedule, participateSchedule });
    } catch (e) {
      console.error(e);
      throw new Error('HomeController/findWholeSchedule');
    }
  }

  /* 내 주변 모임 찾기 */
  @Get('map')
  @ApiOperation({
    summary: '내 주변 모임 찾기 API',
    description: '내 주변 모임을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '내 주변 모임을 조회합니다.',
    schema: {
      example: {
        crewId: 1,
        category: '친목',
        crewTitle: '같이 운동하고 건강한 저녁 함께해요',
        thumbnail: ['url1', 'url2', 'url3'],
        crewDDay: '2023-08-19T03:44:19.661Z',
        crewAddress: '소공동',
        latitude: 23.12132,
        longtitude: 113.12312,
      },
    },
  })
  async getCrew(@Res() res: any): Promise<any> {
    try {
      /* user 정보 확인 */
      // guest일 경우 userId를 0으로 처리
      const user = res.locals.user ? res.locals.user : null;
      const userId = user !== null ? user.userId : 0;

      // 내 주변 모임 조회
      const exCrew = await this.homeService.getCrew(userId);

      /* 장기 모임은 crewDDay가 null로 들어간다. 
      따라서 제일 최근 일정이 crewDDay이므로 제일 최근 일정으로 crewDDay를 조회에서 보내준다.*/
      const promises = exCrew.map(async (item) => {
        if (item.crew_crewDDay === null) {
          const crewId = parseInt(item.crew_crewId);
          const schedule = await this.scheduleService.findScheduleCloseToToday(
            crewId,
          );
          if (schedule) {
            item.crew_crewDDay = schedule.scheduleDDay;
          }
        }
        return item;
      });

      const crew = await Promise.all(promises);

      // 내 주변 모임 조회 결과가 있을 경우
      return res.status(HttpStatus.OK).json(crew);
    } catch (error) {
      console.error(error); // 로깅
      throw new HttpException(
        `리스트 조회 실패: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /* 내 주변 모임 찾기(카테고리별) */
  @Get('map/:category')
  @ApiOperation({
    summary: '내 주변 모임 찾기(카테고리별) API',
    description: '내 주변 모임을 카테고리별로 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '내 주변 모임을 카테고리별로 조회합니다.',
    schema: {
      example: {
        crewId: 1,
        category: '친목',
        crewTitle: '같이 운동하고 건강한 저녁 함께해요',
        thumbnail: ['url1', 'url2', 'url3'],
        crewDDay: '2023-08-19T03:44:19.661Z',
        crewAddress: '소공동',
        latitude: 23.12132,
        longtitude: 113.12312,
      },
    },
  })
  async findCrewByCategoryAndMap(
    @Param('category') category: string,
    @Res() res: any,
  ): Promise<any> {
    try {
      /* user 정보 확인 */
      // guest일 경우 userId를 0으로 처리
      const user = res.locals.user ? res.locals.user : null;
      const userId = user !== null ? user.userId : 0;

      // 카테고리별로 조회
      const crew = await this.homeService.findCrewByCategoryAndMap(
        category,
        userId,
      );

      /* 장기 모임은 crewDDay가 null로 들어간다. 
      따라서 제일 최근 일정이 crewDDay이므로 제일 최근 일정으로 crewDDay를 조회에서 보내준다.*/
      for (let i = 0; i < crew.length; i++) {
        if (crew[i].crew_crewDDay === null) {
          const crewId = parseInt(crew[i].crew_crewId);
          const schedule = await this.scheduleService.findScheduleCloseToToday(
            crewId,
          );
          if (schedule) {
            crew[i].crew_crewDDay = schedule.scheduleDDay;
          }
        }
      }

      // 카테고리별로 조회한 결과가 있을 경우
      return res.status(HttpStatus.OK).json(crew);
    } catch (error) {
      console.error(error); // 로깅
      throw new HttpException(
        `리스트 조회 실패: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /* 관심사별 모임 찾기 */
  @Get(':category')
  @ApiOperation({
    summary: '관심사별 모임 찾기 API',
    description: '관심사별 모임을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '관심사별 모임을 조회합니다.',
    schema: {
      example: {
        crewId: 1,
        category: '친목',
        crewTitle: '같이 운동하고 건강한 저녁 함께해요',
        thumbnail: ['url1', 'url2', 'url3'],
        crewDDay: '2023-08-19T03:44:19.661Z',
        crewAddress: '소공동',
      },
    },
  })
  async findCrewByCategory(
    @Param('category') category: string,
    @Res() res: any,
  ): Promise<any> {
    try {
      /* user 정보 확인 */
      // guest일 경우 userId를 0으로 처리
      const user = res.locals.user ? res.locals.user : null;
      const userId = user !== null ? user.userId : 0;

      // 카테고리별 모임 조회
      const crew = await this.homeService.findCrewByCategory(category, userId);

      /* 장기 모임은 crewDDay가 null로 들어간다. 
      따라서 제일 최근 일정이 crewDDay이므로 제일 최근 일정으로 crewDDay를 조회에서 보내준다.*/
      for (let i = 0; i < crew.length; i++) {
        if (crew[i].crew_crewDDay === null) {
          const crewId = parseInt(crew[i].crew_crewId);
          const schedule = await this.scheduleService.findScheduleCloseToToday(
            crewId,
          );
          if (schedule) {
            crew[i].crew_crewDDay = schedule.scheduleDDay;
          }
        }
      }

      // 카테고리별로 조회한 결과가 있을 경우
      return res.status(HttpStatus.OK).json(crew);
    } catch (e) {
      console.error(e);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: '관심사별 리스트 조회 실패' });
    }
  }
}
