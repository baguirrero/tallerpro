import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { VehiculosService } from './vehiculos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// Solo lectura y para cualquier autenticado, igual que las consultas de
// órdenes. Un vehículo se crea y se actualiza como efecto de crear o editar
// una orden, que ya está limitado por rol.
@Controller('vehiculos')
@UseGuards(JwtAuthGuard)
export class VehiculosController {
  constructor(private readonly vehiculosService: VehiculosService) {}

  @Get('placa/:placa')
  async buscarPorPlaca(@Param('placa') placa: string) {
    return await this.vehiculosService.buscarPorPlaca(placa);
  }

  @Get(':id')
  async obtenerConHistorial(@Param('id') id: string) {
    return await this.vehiculosService.obtenerConHistorial(id);
  }
}
