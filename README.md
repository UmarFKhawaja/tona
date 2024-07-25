# Tona

In this code sample, I explore TypeScript decorators and the `compromise` natural language processing library.

## Introduction

Consider the following code sample:

```typescript
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
```

`Rocket` looks like this:

```typescript
export class Rocket {
  private fuel: Fuel = Fuel.NONE;

  fuelUp(quantity: number, type: FuelType): void {
    this.fuel = new Fuel(quantity, type);
  }

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
```

As things stand, the following output will be produced:

```text
/Projects/tona/src/models/Rocket.ts:27
      throw new Error('it fizzled out');
            ^
Error: it fizzled out
    at Rocket.launch (/Projects/tona/src/models/Rocket.ts:27:13)
    at Object.<anonymous> (/Projects/tona/src/index.ts:7:8)
    at Module._compile (node:internal/modules/cjs/loader:1358:14)
    at Module.m._compile (/Projects/tona/node_modules/ts-node/src/index.ts:1618:23)
    at Module._extensions..js (node:internal/modules/cjs/loader:1416:10)
    at Object.require.extensions.<computed> [as .ts] (/Projects/tona/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1208:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1024:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:174:12)
    at phase4 (/Projects/tona/node_modules/ts-node/src/bin.ts:649:14)
```

Because `launch` can throw exceptions, ordinarily, we have to put try/catch blocks around calls to it so that errors may be handled gracefully.

It would be nice if `fuelUp` and `launch` could log and handle errors with minimal repetitive, boilerplate code.

One option to achieve this is through the use of TypeScript decorators.

Here's what our revised `Rocket` class will look like:

```typescript
export class Rocket {
  private fuel: Fuel = Fuel.NONE;

  @catchError<void>(void 0)
  fuelUp(quantity: number, type: FuelType): void {
    this.fuel = new Fuel(quantity, type);
  }

  @catchError<number>(-1)
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
```

Take a look at what [`catchError`](src/decorators/catchError.ts) looks like.

The new output -- with the `catchError` decorator being used, is as follows:

```text
** actual launch of Apollo 13 with countdown of 10 seconds **
** actual launch of Apollo 14 with countdown of 10 seconds **
```

This is better that what we started with, but we don't really know what happened. Some calls failed, but we have no idea which ones failed, and why.

So let's add one more decorator, [`log`](src/decorators/log.ts). This will log a message before executing a method, and then log another message after execution has completed, taking into account success or failure.

Here's what `Rocket` looks like with the addition of the `log` decorator:

```typescript
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
```

> NB: The order in which the decorators are applied is important.

The resulting output is as follows:

```text
2024-07-25T22:10:06.343Z: will fuel up the rocket; [100,"NOTHING"]
2024-07-25T22:10:06.344Z: fuelled up the rocket; [100,"NOTHING"]; undefined
2024-07-25T22:10:06.345Z: will launch the rocket; [10,"Apollo 11"]
2024-07-25T22:10:06.345Z: did not launch the rocket because it fizzled out; 
2024-07-25T22:10:06.345Z: will fuel up the rocket; [100,"GASEOUS_FUEL"]
2024-07-25T22:10:06.345Z: fuelled up the rocket; [100,"GASEOUS_FUEL"]; undefined
2024-07-25T22:10:06.345Z: will launch the rocket; [10,"Apollo 12"]
2024-07-25T22:10:06.345Z: did not launch the rocket because it blew up; 
2024-07-25T22:10:06.345Z: will fuel up the rocket; [100,"LIQUID_FUEL"]
2024-07-25T22:10:06.345Z: fuelled up the rocket; [100,"LIQUID_FUEL"]; undefined
2024-07-25T22:10:06.345Z: will launch the rocket; [10,"Apollo 13"]
** actual launch of Apollo 13 with countdown of 10 seconds **
2024-07-25T22:10:06.345Z: launched the rocket; [10,"Apollo 13"]; 1000
2024-07-25T22:10:06.345Z: will fuel up the rocket; [100,"SOLID_FUEL"]
2024-07-25T22:10:06.345Z: fuelled up the rocket; [100,"SOLID_FUEL"]; undefined
2024-07-25T22:10:06.346Z: will launch the rocket; [10,"Apollo 14"]
** actual launch of Apollo 14 with countdown of 10 seconds **
2024-07-25T22:10:06.346Z: launched the rocket; [10,"Apollo 14"]; 10000
```

The actual output is a bit more colorful, but note that:

* `will fuel the rocket up` has been converted to `fuelled up the rocket` for success and `did not launch the rocket...` for failure.
* `will launch the rocket` has been converted to `launched the rocket` for success and `did not launch the rocket...` for failure.

This was achieved through the use of the [`compromise`](https://www.npmjs.com/package/compromise) natural processing library.

It should be pointed out that careful selection of the initial logging text and the message in any exceptions thrown can produce very intelligible logs.

## Explanation

A decorator can be applied to a `class`, `method`, `getter`, `setter`, `field`, or `accessor`.

In this case, we have created decorators that can be applied to a `method`.

A decorator receives the target, and returns something that looks like a target -- which then acts in place of the original.

For example, a decorator to measure performance might look like this:

```typescript
function measurePerformance(target: Function, context: DecoratorContext) {
  // NOTE : check if the decorator is being attached to a method, a getter, or a setter
  //        by checking the "context"
  if (context.kind === 'method' || context.kind === 'getter' || context.kind === 'setter') {
    // NOTE : wrap the "target", i.e., the original in a try/finally statement,
    //        contained in a new function that will replace the original
    return function (...args: any[]) {
      try {
        // TODO : start measuring performance here
        return target.call(this, ...args);
      } finally {
        // TODO : end measuring performance here
      }
    };
  }
}
```

Here's how this decorator might be used:

```typescript
class Rocket {
  @measurePerformance
  separateFirstStage() {
    // TODO : implement 1st stage separation here
  }
}
```

But what if we want to be able to specify the unit of measurement?

That's easy: just wrap the decorator in a function that returns the decorator function. Any parameters needed to be passed to the decorator can then be provided as parameters of the outer function.

Here's an example:

```typescript
function measurePerformance(units: 'seconds' | 'milliseconds') {
  return function (target: Function, context: DecoratorContext) {
    // NOTE : check if the decorator is being attached to a method, a getter, or a setter
    //        by checking the "context"
    if (context.kind === 'method' || context.kind === 'getter' || context.kind === 'setter') {
      // NOTE : wrap the "target", i.e., the original in a try/finally statement,
      //        contained in a new function that will replace the original
      return function (...args: any[]) {
        try {
          // TODO : start measuring performance in "units" here
          return target.call(this, ...args);
        } finally {
          // TODO : end measuring performance in "units" here
        }
      };
    }
  }
}
```

And this is how it will be used in code:

```typescript
class Rocket {
  @measurePerformance('seconds')
  separateFirstStage() {
    // TODO : implement 1st stage separation here
  }
}
```
