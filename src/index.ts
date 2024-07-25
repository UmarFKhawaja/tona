import { FuelType } from './models/FuelType';
import { Rocket } from './models/Rocket';

const rocket: Rocket = new Rocket();

rocket.fuelUp(100, FuelType.NOTHING);
rocket.launch(10, 'Apollo 11');

rocket.fuelUp(100, FuelType.GASEOUS_FUEL);
rocket.launch(10, 'Apollo 12');

rocket.fuelUp(100, FuelType.LIQUID_FUEL);
rocket.launch(10, 'Apollo 13');

rocket.fuelUp(100, FuelType.SOLID_FUEL);
rocket.launch(10, 'Apollo 14');
