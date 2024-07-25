import { catchError } from '../decorators/catchError';
import { log } from '../decorators/log';
import { Fuel } from './Fuel';
import { FuelType } from './FuelType';

export class Rocket {
  private fuel: Fuel = Fuel.NONE;

  @catchError<void>(void 0)
  @log('will fuel up the rocket')
  fuelUp(quantity: number, type: FuelType): void {
    this.fuel = new Fuel(quantity, type);
  }

  @catchError<number>(-1)
  @log('will launch the rocket')
  launch(countDown: number, callSign: string): number {
    if (this.fuel.isAvailable) {
      if (this.fuel.isVolatile) {
        throw new Error('it blew up');
      }

      console.log(`** actual launch of ${callSign} with countdown of ${countDown} seconds **`);

      return this.fuel.energy;
    } else {
      throw new Error('it fizzled out');
    }
  }
}
