import { Module, forwardRef } from '@nestjs/common';
import { MemberService } from './member.service';
import { MemberRepository } from './member.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from './entities/member.entity';
import { CrewModule } from 'src/crew/crew.module';
import { SignupModule } from 'src/signup/signup.module';
import { VoteFormModule } from 'src/voteform/voteform.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Member]),
    // 순환 의존성
    forwardRef(() => CrewModule),
    forwardRef(() => SignupModule),
    forwardRef(() => VoteFormModule),
  ],
  providers: [MemberService, MemberRepository],
  exports: [MemberService, MemberRepository],
})
export class MemberModule {}
