import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Schedule } from './entities/schedule.entity';
import { CreateScheduleDto } from './dto/createSchedule.dto';
import { EditScheduleDto } from './dto/editSchedule.dto';
import { Repository, EntityManager } from 'typeorm';

@Injectable()
export class ScheduleRepository {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    private readonly entityManager: EntityManager,
  ) {}

  // 일정 조회
  async findSchedule(userId: number): Promise<any[]> {
    const query = `
     SELECT 
            schedule.scheduleTitle,
            schedule.scheduleDDay,
            users_member.profileImage AS member_profileImage, -- 해당 크루에 포함된 멤버의 이미지 (users 테이블에서 가져옴)
            users.userId,
            member.userId AS member_userId,
            crew.crewId,
            users_member.nickname AS member_userName
       FROM  schedule
  LEFT JOIN  users ON schedule.userId = users.userId -- 일정을 작성한 사람과 users 테이블 조인
  LEFT JOIN crew ON schedule.crewId = crew.crewId -- 일정이 속한 크루와 crew 테이블 조인
  LEFT JOIN member ON crew.crewId = member.crewId -- 크루에 포함된 멤버와 member 테이블 조인
  LEFT JOIN users AS users_member ON member.userId = users_member.userId -- 멤버의 이미지를 users 테이블에서 가져옴
      WHERE crew.crewId IN (SELECT crewId FROM member WHERE userId = ${userId});`;

    const result = await this.entityManager.query(query);
    return result;
  }

  // 일정 생성
  async createSchedule(
    createScheduleDto: CreateScheduleDto,
    userId: number,
    crewId: number,
  ): Promise<Schedule> {
    const schedule = new Schedule();
    schedule.userId = userId;
    schedule.crewId = crewId;
    schedule.scheduleTitle = createScheduleDto.scheduleTitle;
    schedule.scheduleContent = createScheduleDto.scheduleContent;
    schedule.scheduleDDay = createScheduleDto.scheduleDDay;
    schedule.scheduleAddress = createScheduleDto.scheduleAddress;
    schedule.scheduleLatitude = createScheduleDto.scheduleLatitude;
    schedule.scheduleLongitude = createScheduleDto.scheduleLongitude;

    const createdSchedule = await this.scheduleRepository.save(schedule);

    return createdSchedule;
  }

  // 일정 수정
  async editSchedule(
    editScheduleDto: EditScheduleDto,
    userId: number,
    crewId: number,
    scheduleId: number,
  ): Promise<any> {
    const schedule = await this.scheduleRepository.findOne({
      where: { scheduleId, userId, crewId },
    });

    // 수정할 필드만 선택적으로 업데이트
    schedule.scheduleTitle =
      editScheduleDto.scheduleTitle || schedule.scheduleTitle;
    schedule.scheduleAddress =
      editScheduleDto.scheduleAddress || schedule.scheduleAddress;
    schedule.scheduleDDay =
      editScheduleDto.scheduleDDay || schedule.scheduleDDay;
    schedule.scheduleContent =
      editScheduleDto.scheduleContent || schedule.scheduleContent;
    schedule.scheduleLatitude =
      editScheduleDto.scheduleLatitude || schedule.scheduleLatitude;
    schedule.scheduleLongitude =
      editScheduleDto.scheduleLongitude || schedule.scheduleLongitude;

    const updatedSchedule = await this.scheduleRepository.save(schedule);

    return updatedSchedule;
  }

  // 일정 상세 조회
  async findScheduleDetail(scheduleId: number, crewId: number): Promise<any> {
    const schedule = await this.scheduleRepository
      .createQueryBuilder('schedule')
      .leftJoin('schedule.crewId', 'crew') // crew 테이블과의 join
      .leftJoin('crew', 'crew', 'crew.crewId = schedule.crewId')
      .leftJoin(
        'participant',
        'participant',
        'participant.crewId = schedule.crewId',
      )
      .leftJoin('users', 'users', 'users.userId = schedule.userId')
      .where('schedule.scheduleId = :scheduleId', { scheduleId }) // 해당 scheduleId를 가진 멤버만 필터링
      .andWhere('crew.crewId = :crewId', { crewId }) // 해당 crewId를 가진 멤버만 필터링
      .select([
        'schedule.scheduleTitle',
        'schedule.scheduleDDay',
        'schedule.scheduleContent',
        'schedule.scheduleAddress',
        'schedule.scheduleLatitude',
        'schedule.scheduleLongitude',
        'crew.crewMaxMember',
        'COUNT(participant.crewId) AS scheduleAttendedMember',
        'users.profileImage AS captainProfileImage',
      ]) // 필요한 필드만 선택
      .getOne();

    return schedule;
  }

  // 일정 삭제
  async deleteSchedule(scheduleId: number, crewId: number): Promise<any> {
    const schedule = await this.scheduleRepository.findOne({
      where: { scheduleId, crewId },
    });

    const deletedSchedule = await this.scheduleRepository.softRemove(schedule); // soft delete

    return deletedSchedule;
  }

  /* crew에 해당하는 schedule 조회 */
  async findScheduleByCrew(crewId: number): Promise<any> {
    const schedule = await this.scheduleRepository
      .createQueryBuilder('schedule')
      .select([
        'scheduleTitle',
        'scheduleContent',
        'scheduleDDay',
        'scheduleAddress',
        'scheduleLatitude',
        'scheduleLongitude',
      ])
      .where('schedule.crewId = :id', { id: crewId })
      .getRawMany();
    return schedule;
  }

  /* 오늘 날짜 기준보다 날짜가 지난 일정을 찾아 IsDone을 true로 전환 */
  async updateScheduleIsDone(): Promise<any> {
    const currentDate = new Date();
    const scheduleBeforeToday = await this.scheduleRepository
      .createQueryBuilder('schedule')
      .where('schedule.schedule < :currentDate', { currentDate })
      .getRawMany();

    for (const schedule of scheduleBeforeToday) {
      if (currentDate > schedule) {
        schedule.scheduleIsDone = true;
        await this.scheduleRepository.save(schedule);
      }
    }
  }
}
