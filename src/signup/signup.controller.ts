import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Res,
} from '@nestjs/common';
import { SignupService } from './signup.service';
// import { CreateSignupFormDto } from './dto/create-signupForm.dto';
import { SubmitSignupDto } from './dto/submit-signup.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger/dist';
import { CrewService } from 'src/crew/crew.service';
import { ConfirmSingupDto } from './dto/confirm-singup.dto';

@Controller()
@ApiTags('signup API')
export class SignupController {
  constructor(
    private readonly signupService: SignupService,
    private readonly crewService: CrewService,
  ) {}

  /* 모임 가입(form 생성): 버전 업그레이드에 맞춰 사용*/
  // @Post('signupform/:crewId/createform')
  // @ApiOperation({
  //   summary: '모임 가입 form 생성 API',
  //   description: '모임 가입 양식 생성',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: '모임 가입 양식 작성 완료',
  // })
  // async createSignupForm(
  //   @Param('crewId') crewId: number,
  //   @Body() createSignupFormDto: CreateSignupFormDto,
  //   @Res() res: any,
  // ): Promise<any> {
  //   if (!createSignupFormDto.question1 || !createSignupFormDto.question2) {
  //     throw new Error('질문을 작성해주세요');
  //   }
  //   await this.signupService.createSignupForm(crewId, createSignupFormDto);
  //   return res
  //     .status(HttpStatus.CREATED)
  //     .json({ message: '모임 가입 양식 작성 완료' });
  // }

  /* 모임 가입(form 불러오기) */
  @Get('signupform/:signupFormId')
  @ApiOperation({
    summary: '모임 가입 form 불러오기 API',
    description: '모임 가입 form 불러오기',
  })
  @ApiResponse({
    status: 200,
    description: '모임 가입 양식 불러오기',
    schema: {
      example: {
        signupFormId: 1,
        question1: '자기소개 또는 가입 동기',
        question2: '나를 표현하는 형용사 3가지는?',
        crewId: 1,
      },
    },
  })
  async findOneSignupForm(
    @Param('signupFormId')
    signupFormId: number,
    @Res() res: any,
  ): Promise<any> {
    const signupForm = await this.signupService.findOneSignupForm(signupFormId);
    return res.status(HttpStatus.OK).json(signupForm);
  }

  /* 모임 가입 작성 */
  @Post('signup/:crewId/:signupFormId/submit')
  @ApiOperation({
    summary: '모임 가입 작성 API',
    description: '모임 가입 작성',
  })
  @ApiResponse({
    status: 200,
    description: '모임 가입 작성 완료',
  })
  async submitSignup(
    @Param('crewId') crewId: number,
    @Param('signupFormId') signupFormId: number,
    @Body() submitSignupDto: SubmitSignupDto,
    @Res() res: any,
  ): Promise<any> {
    const { userId } = res.locals.user;
    if (!submitSignupDto.answer1 || !submitSignupDto.answer2) {
      throw new Error('작성을 완료해주세요');
    }
    await this.signupService.submitSignup(
      userId,
      crewId,
      signupFormId,
      submitSignupDto,
    );
    return res
      .status(HttpStatus.CREATED)
      .json({ message: '모임 가입서 작성 완료' });
  }

  /* 제출한 가입서 조회 */
  @Get('signup/:crewId')
  @ApiOperation({
    summary: '제출한 가입서 조회 API',
    description: '제출한 가입서 불러오기',
  })
  @ApiResponse({
    status: 200,
    description: '제출한 가입서 불러오기',
    schema: {
      example: {
        userId: 1,
        answer1: '자기소개 또는 가입 동기',
        answer2: '나를 표현하는 형용사 3가지는?',
      },
    },
  })
  async findAllSubmitted(
    @Param('crewId') crewId: number,
    @Res() res: any,
  ): Promise<any> {
    const { userId } = res.locals.user;
    const crew = await this.crewService.findCrewDetail(crewId);
    if (crew.userId === userId) {
      const singup = await this.signupService.findAllSubmitted(crewId);
      return res.status(HttpStatus.OK).json(singup);
    } else {
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .json({ message: '모임장이 아닙니다. 접근 권한이 없습니다.' });
    }
  }

  /* 모임 참여 (방장 승인 여부)API */
  @Put('signup/:singupId/confirmsingup')
  @ApiOperation({
    summary: '모임 참여 승인 여부 API',
    description: '제출한 가입서에 대한 승인 여부',
  })
  @ApiResponse({
    status: 200,
    description: '모임 가입서 확인 완료',
  })
  async confirmSingup(
    @Param('signupId') singupId: number,
    @Body() confirmSingupDto: ConfirmSingupDto,
    @Res() res: any,
  ): Promise<any> {
    await this.signupService.confirmSingup(singupId, confirmSingupDto);
    return res.status(HttpStatus.OK).json({ message: '모임 가입서 확인 완료' });
  }
}
