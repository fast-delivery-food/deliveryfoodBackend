import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({
    summary:'Barcha userlar royxati'
  })
  @ApiResponse({status:200,description:'Barcha user muvaffaqiyatli olindi'})
  getAll(){
    return this.userService.findAll()
  }

}
