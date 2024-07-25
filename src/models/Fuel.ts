import { FuelType } from './FuelType';

export class Fuel {
  public static NONE = new Fuel(0, FuelType.NOTHING);

  constructor(
    private quantity: number,
    private type: FuelType
  ) {
  }

  get isAvailable(): boolean {
    return this.quantity > 0 && this.type !== FuelType.NOTHING;
  }

  get isVolatile(): boolean {
    return this.type === FuelType.GASEOUS_FUEL;
  }

  get energy(): number {
    switch (this.type) {
      case FuelType.NOTHING:
        return 0;

      case FuelType.GASEOUS_FUEL:
        return this.quantity;

      case FuelType.LIQUID_FUEL:
        return this.quantity * 10;

      case FuelType.SOLID_FUEL:
        return this.quantity * 100;

      default:
        throw new Error('fuel has no known energy');
    }
  }
}
